import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { FINANCIAL_ASSISTANT_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { FINANCIAL_ASSISTANT_TOOLS } from '@/lib/ai/tools';
import { executeToolFunction } from '@/lib/ai/tool-functions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Get user authentication
    const { createServerClient } = await import('@/lib/supabase-server');
    const supabase = await createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('🔑 Chat Stream API: Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🔑 Chat Stream API: Authenticated user:', user.id);

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Add system message for financial assistant context
    const systemMessage = {
      role: "system" as const,
      content: FINANCIAL_ASSISTANT_SYSTEM_PROMPT
    };

    // Stream response from OpenAI
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [systemMessage, ...messages],
      tools: FINANCIAL_ASSISTANT_TOOLS,
      tool_choice: "auto",
      stream: true
    });

    // Create a ReadableStream to handle streaming
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let isClosed = false;
        
        const safeEnqueue = (data: any) => {
          if (!isClosed) {
            try {
              controller.enqueue(data);
            } catch (error) {
              console.error('Error enqueueing data:', error);
              isClosed = true;
            }
          }
        };
        
        try {
          let accumulatedMessage = '';
          let toolCalls: any[] = [];
          let isComplete = false;
          
          for await (const chunk of stream) {
            if (isClosed) break;
            
            const delta = chunk.choices[0]?.delta;
            
            if (delta?.content) {
              // Stream content directly
              accumulatedMessage += delta.content;
              safeEnqueue(
                encoder.encode(`data: ${JSON.stringify({ content: delta.content, done: false })}\n\n`)
              );
            }
            
            if (delta?.tool_calls) {
              // Handle tool calls (function calling) - Fix for multi-tool calls
              delta.tool_calls.forEach((toolCall: any) => {
                const existingIndex = toolCalls.findIndex(tc => tc.index === toolCall.index);
                
                if (existingIndex >= 0) {
                  // Update existing tool call
                  if (toolCall.id) {
                    toolCalls[existingIndex].id = toolCall.id;
                  }
                  if (toolCall.type) {
                    toolCalls[existingIndex].type = toolCall.type;
                  }
                  if (toolCall.function) {
                    if (!toolCalls[existingIndex].function) {
                      toolCalls[existingIndex].function = {};
                    }
                    if (toolCall.function.name) {
                      toolCalls[existingIndex].function.name = toolCall.function.name;
                    }
                    if (toolCall.function.arguments) {
                      toolCalls[existingIndex].function.arguments = (toolCalls[existingIndex].function.arguments || '') + toolCall.function.arguments;
                    }
                  }
                } else {
                  // Add new tool call
                  toolCalls.push({
                    index: toolCall.index,
                    id: toolCall.id || `call_${Date.now()}_${toolCall.index}`,
                    type: toolCall.type || 'function',
                    function: {
                      name: toolCall.function?.name || '',
                      arguments: toolCall.function?.arguments || ''
                    }
                  });
                }
              });
            }
            
            if (chunk.choices[0]?.finish_reason === 'tool_calls') {
              // Process tool calls
              safeEnqueue(
                encoder.encode(`data: ${JSON.stringify({ content: '\n\n*💡 Thinking...*\n\n', done: false })}\n\n`)
              );
              
              const toolResults = [];
              
              // Execute all tool calls in parallel for better performance
              const toolPromises = toolCalls.map(async (toolCall) => {
                try {
                  const result = await executeToolFunction(toolCall.function.name, toolCall.function.arguments, user.id);
                  
                  return {
                    role: "tool" as const,
                    content: JSON.stringify(result),
                    tool_call_id: toolCall.id
                  };
                } catch (error) {
                  console.error(`Error executing tool ${toolCall.function.name}:`, error);
                  return {
                    role: "tool" as const,
                    content: JSON.stringify({ error: `Failed to execute ${toolCall.function.name}` }),
                    tool_call_id: toolCall.id
                  };
                }
              });
              
              // Wait for all tool calls to complete
              const resolvedToolResults = await Promise.all(toolPromises);
              toolResults.push(...resolvedToolResults);
              
              // Clean up tool calls for OpenAI - remove index property and ensure proper structure
              const cleanedToolCalls = toolCalls.map(tc => ({
                id: tc.id,
                type: tc.type,
                function: {
                  name: tc.function.name,
                  arguments: tc.function.arguments
                }
              }));
              
              // Get follow-up response with tool results
              const followUpStream = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                  systemMessage,
                  ...messages,
                  { 
                    role: "assistant", 
                    content: accumulatedMessage || null, 
                    tool_calls: cleanedToolCalls 
                  },
                  ...toolResults
                ],
                stream: true
              });
              
              for await (const followUpChunk of followUpStream) {
                if (isClosed) break;
                
                const followUpDelta = followUpChunk.choices[0]?.delta;
                
                if (followUpDelta?.content) {
                  safeEnqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: followUpDelta.content, done: false })}\n\n`)
                  );
                }
                
                if (followUpChunk.choices[0]?.finish_reason === 'stop') {
                  isComplete = true;
                  break;
                }
              }
            }
            
            if (chunk.choices[0]?.finish_reason === 'stop' || isComplete) {
              safeEnqueue(
                encoder.encode(`data: ${JSON.stringify({ content: '', done: true })}\n\n`)
              );
              break;
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          safeEnqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Streaming failed', done: true })}\n\n`)
          );
        } finally {
          if (!isClosed) {
            controller.close();
            isClosed = true;
          }
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat streaming API error:', error);
    return NextResponse.json(
      { error: 'Failed to process streaming chat request' },
      { status: 500 }
    );
  }
} 