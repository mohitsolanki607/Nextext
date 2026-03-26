import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY });

export async function generateAudioSummary(text: string, voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore') {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read this content clearly and naturally. Keep it concise if it's long: ${text.substring(0, 1000)}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    throw new Error("No audio data received");
  } catch (error) {
    console.error("Audio generation error:", error);
    throw error;
  }
}

export async function generateBattleQuestions(subject: string, language: string = 'English') {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 5 multiple-choice questions for the subject: ${subject}. These should be relevant for Indian government exams (UPSC, SSC, etc.). Please provide the questions and options in ${language}. Return as a JSON array of objects with 'question', 'options' (array of 4 strings), and 'answer' (index 0-3).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answer: { type: Type.INTEGER }
            },
            required: ["question", "options", "answer"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Battle Error:", error);
    return [];
  }
}

export async function solveProblemFromImageStream(base64Image: string, mimeType: string, language: string = 'English', onChunk: (text: string) => void) {
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: `You are a professional tutor. Analyze this image and solve the problem or answer the question shown. 
          Provide a clear, step-by-step explanation. 
          If it's a math problem, show all steps. 
          If it's a theoretical question, provide a detailed answer with key points.
          Please provide the entire response in ${language}. Use Markdown.`,
        },
      ],
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Snap & Solve Error:", error);
    throw error;
  }
}

export async function generateQuizFromImageStream(base64Image: string, mimeType: string, language: string = 'English', onChunk: (text: string) => void) {
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: `Analyze the text in this image and generate a 5-question multiple-choice quiz based on the content. 
          Provide the questions, options, and correct answers with brief explanations for each. 
          Please provide the entire response in ${language}. Use Markdown.`,
        },
      ],
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Snap & Quiz Error:", error);
    throw error;
  }
}

export async function translateImageTextStream(base64Image: string, mimeType: string, targetLanguage: string, onChunk: (text: string) => void) {
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: `Extract the text from this image and translate it accurately into ${targetLanguage}. 
          Provide the original text first, then the translated version. 
          Include a section for "Key Vocabulary" found in the text.
          Use Markdown with clear headings.`,
        },
      ],
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Snap & Translate Error:", error);
    throw error;
  }
}

export async function fetchExamResourcesStream(exam: string, subject: string, onChunk: (text: string) => void) {
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: `You are an expert exam coach. For the ${exam} exam (2026 pattern), subject: ${subject}, provide a COMPREHENSIVE study guide. 
      DO NOT just provide links. Instead:
      1. Summarize the most important 5-7 topics for this subject.
      2. Provide 3-5 high-quality practice questions with detailed explanations.
      3. Give specific tips for the 2026 exam pattern.
      4. ONLY at the end, provide 2-3 verified links for further reading.
      Use Markdown with clear headings and bold text for emphasis.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("AI Resource Search Error:", error);
    throw error;
  }
}

export async function fetchPreviousYearPapersStream(exam: string, subject: string, onChunk: (text: string) => void) {
  try {
    const isFullPaper = subject.toLowerCase().includes('full length') || subject.toLowerCase().includes('all subjects');
    const subjectPrompt = isFullPaper ? 'all subjects' : `the subject: ${subject}`;
    
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: `You are an exam archivist. For the ${exam} exam, specifically for ${subjectPrompt}, provide a detailed analysis and content of Previous Year Papers (2021-2025).
      1. For each year, list 3-5 ACTUAL questions that were asked in the exam.
      2. Provide the correct answers and a brief explanation for each.
      3. Provide DIRECT links to official PDF downloads for these papers (search for official sites like UPSC, NTA, SSC, etc.).
      4. Summarize the weightage of different topics over the last 5 years.
      Format as Markdown with clear headings for each year.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("AI PYQ Search Error:", error);
    throw error;
  }
}

export async function generateWeeklyExam(subject: string) {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a comprehensive 10-question multiple-choice exam for the subject: ${subject}. This is for a weekly competition. Return as a JSON array of objects with 'question', 'options' (array of 4 strings), and 'answer' (index 0-3).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answer: { type: Type.INTEGER }
            },
            required: ["question", "options", "answer"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Weekly Exam Error:", error);
    return [];
  }
}

export async function generateMnemonicExplanationStream(subject: string, topic: string, language: string = 'English', onChunk: (text: string) => void) {
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: `Explain the topic "${topic}" in the subject "${subject}" using creative mnemonics, simple analogies, and a "cartoon-style" narrative. Make it extremely easy for a school student to understand and remember. Please provide the entire response in ${language}. Use Markdown.`,
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("AI Mnemonic Error:", error);
    throw error;
  }
}

export async function generateMnemonicExplanation(subject: string, topic: string, language: string = 'English') {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Explain the topic "${topic}" in the subject "${subject}" using creative mnemonics, simple analogies, and a "cartoon-style" narrative. Make it extremely easy for a school student to understand and remember. Please provide the entire response in ${language}. Use Markdown.`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Mnemonic Error:", error);
    throw error;
  }
}

export async function searchGlobalLibrariesStream(query: string, onChunk: (text: string) => void) {
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: `Find digital access links, PDF downloads, or online reading options for the book or topic: "${query}". Search across top global digital libraries like Project Gutenberg, Open Library, HathiTrust, Google Books, and National Libraries. Provide a list of 5-8 verified links with titles and descriptions. Format as Markdown.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Global Library Search Error:", error);
    throw error;
  }
}

export async function searchGlobalLibraries(query: string) {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find digital access links, PDF downloads, or online reading options for the book or topic: "${query}". Search across top global digital libraries like Project Gutenberg, Open Library, HathiTrust, Google Books, and National Libraries. Provide a list of 5-8 verified links with titles and descriptions. Format as Markdown.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Global Library Search Error:", error);
    throw error;
  }
}

export async function findStudyResourcesStream(topic: string, language: string = 'English', onChunk: (text: string) => void) {
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: `Find 3 high-quality educational resources (articles or videos) for the topic: ${topic}. Provide titles and URLs. Please provide the response and descriptions in ${language}.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("AI Search Error:", error);
    throw error;
  }
}

export async function generateInteractiveMockTest(exam: string, subject: string) {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a comprehensive 10-question multiple-choice mock test for the ${exam} exam (2026 pattern), subject: ${subject}. Return as a JSON array of objects with 'question', 'options' (array of 4 strings), 'answer' (index 0-3), and 'explanation' (string).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answer: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "answer", "explanation"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Interactive Mock Test Error:", error);
    return [];
  }
}

export async function generateAIMockTest(exam: string, subject: string) {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a comprehensive AI-created mock test for the ${exam} exam based on the latest 2026 exam pattern, specifically for the subject: ${subject}. Include 10 high-quality multiple-choice questions with detailed explanations for each answer. Format the output in clear Markdown with bold questions and numbered options.`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Mock Test Error:", error);
    throw error;
  }
}

export async function solveDiagramProblemStream(base64Image: string, mimeType: string, language: string = 'English', onChunk: (text: string) => void) {
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: `You are a specialized Diagram & Visual Problem Solver. 
          1. Analyze the diagram, chart, or visual problem in this image.
          2. Provide a detailed explanation of the concepts shown in the diagram.
          3. Solve any specific question asked or implied by the diagram.
          4. Provide "Visual Notes" - a summary of the key parts of the diagram and what they represent.
          Please provide the entire response in ${language}. Use Markdown with clear headings.`,
        },
      ],
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Diagram Solver Error:", error);
    throw error;
  }
}

export async function generateReelContentStream(base64Image: string, mimeType: string, onChunk: (text: string) => void) {
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: `Act as the NexText Content Producer for School Students (Class 6-12). Analyze the textbook page in this image (Science, SST, or Maths).
          
          Reel Structure: Do NOT provide long paragraphs. Transform the text into exactly 7 vertical 'Story Slides'.
          
          Slide Content: Each slide must have a maximum of 3 short, punchy bullet points (less than 15 words per point).
          
          The Hook: Use relevant, popular emojis on every single slide (e.g., 🧪, 🌎, 📐, 🔥, 💡).
          
          Tone: Use a 'Big Brother/Sister' tone—a mix of English and very simple Hindi (Hinglish). Use terms like 'Dekho, ye important hai!' (Look, this is important!).
          
          Visual Instruction: For each slide, write a short description in brackets [like this] suggesting what image or simple animation (like a moving magnet for physics) should be shown on that slide.
          
          Format the output as a series of slides (Slide 1, Slide 2, etc.).`,
        },
      ],
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Snap & Reel Error:", error);
    throw error;
  }
}

export async function generateStudyNotesStream(subject: string, exam: string, style: 'structured' | 'hand-written', onChunk: (text: string) => void) {
  try {
    const stylePrompt = style === 'hand-written' 
      ? 'Use a "hand-written" style: include mnemonics, bullet points, simple analogies, and clear diagrams descriptions. Focus on memorization.' 
      : 'Use a "structured" style: include clear headings, sub-headings, key facts, and a logical flow. Focus on quick revision and clarity.';

    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: `Act as the NexText Content Architect. Your goal is to transform complex textbook data into 'Micro-Learning Bites' for Gen-Z students.
      
      Create HIGH-QUALITY, IN-DEPTH study notes for the subject "${subject}" tailored for the "${exam}" exam (2026 pattern).
      
      Follow these rules strictly:
      1. Start with a 1-sentence 'TL;DR' (Too Long; Didn't Read) summary.
      2. Use the 5-Point Rule: Never explain a concept in more than 5 bullet points.
      3. Visual Structure: Use bold headers and relevant emojis (e.g., 🧬 for Bio, 📜 for History, 📐 for Math) to make the text easy to scan.
      4. The 'So What?' Factor: Every note must end with a 'Pro-Tip' or 'Exam Hack' (e.g., 'SSC often asks about this specific year').
      5. Language: Use a friendly 'Hinglish' tone (mix of Hindi and English) so it feels like a senior student is explaining to a junior.
      
      ${stylePrompt} Use Markdown.`,
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("AI Notes Error:", error);
    throw error;
  }
}

export async function generateAISyllabusStream(exam: string, subject: string, onChunk: (text: string) => void) {
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: `Provide the latest 2026 syllabus for the ${exam} exam, specifically for the subject: ${subject}. Breakdown the topics, sub-topics, and weightage if available. Use Markdown with clear headings and a structured layout.`,
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("AI Syllabus Error:", error);
    throw error;
  }
}

export async function summarizeStudyMaterialStream(content: string, language: string = 'English', onChunk: (text: string) => void) {
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: `Act as the NexText Content Architect. Your goal is to transform complex textbook data into 'Micro-Learning Bites' for Gen-Z students.
      
      Follow these rules strictly:
      1. Start with a 1-sentence 'TL;DR' (Too Long; Didn't Read) summary.
      2. Use the 5-Point Rule: Never explain a concept in more than 5 bullet points.
      3. Visual Structure: Use bold headers and relevant emojis (e.g., 🧬 for Bio, 📜 for History, 📐 for Math) to make the text easy to scan.
      4. The 'So What?' Factor: Every note must end with a 'Pro-Tip' or 'Exam Hack' (e.g., 'SSC often asks about this specific year').
      5. Language: Use a friendly 'Hinglish' tone (mix of Hindi and English) so it feels like a senior student is explaining to a junior.
      
      Please provide the entire response in ${language} (but keep the Hinglish tone as requested).
      
      Content to transform: ${content}`,
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("AI Streaming Error:", error);
    throw error;
  }
}

export async function askAiAssistantStream(prompt: string, language: string = 'English', onChunk: (text: string) => void) {
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: `Act as the NexText Content Architect. Your goal is to transform complex textbook data into 'Micro-Learning Bites' for Gen-Z students.
      
      Answer the following question or help with the task. Provide clear, accurate, and helpful information.
      
      Follow these rules strictly:
      1. Start with a 1-sentence 'TL;DR' (Too Long; Didn't Read) summary.
      2. Use the 5-Point Rule: Never explain a concept in more than 5 bullet points.
      3. Visual Structure: Use bold headers and relevant emojis (e.g., 🧬 for Bio, 📜 for History, 📐 for Math) to make the text easy to scan.
      4. The 'So What?' Factor: Every note must end with a 'Pro-Tip' or 'Exam Hack' (e.g., 'SSC often asks about this specific year').
      5. Language: Use a friendly 'Hinglish' tone (mix of Hindi and English) so it feels like a senior student is explaining to a junior.
      
      Please provide the entire response in ${language} (but keep the Hinglish tone as requested). Use Markdown. 
      
      Question/Task: ${prompt}`,
    });

    let fullText = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("AI Assistant Streaming Error:", error);
    throw error;
  }
}

export async function summarizeStudyMaterial(content: string, language: string = 'English') {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Act as the NexText Content Architect. Your goal is to transform complex textbook data into 'Micro-Learning Bites' for Gen-Z students.
      
      Follow these rules strictly:
      1. Start with a 1-sentence 'TL;DR' (Too Long; Didn't Read) summary.
      2. Use the 5-Point Rule: Never explain a concept in more than 5 bullet points.
      3. Visual Structure: Use bold headers and relevant emojis (e.g., 🧬 for Bio, 📜 for History, 📐 for Math) to make the text easy to scan.
      4. The 'So What?' Factor: Every note must end with a 'Pro-Tip' or 'Exam Hack' (e.g., 'SSC often asks about this specific year').
      5. Language: Use a friendly 'Hinglish' tone (mix of Hindi and English) so it feels like a senior student is explaining to a junior.
      
      Please provide the entire response in ${language} (but keep the Hinglish tone as requested).
      
      Content to transform: ${content}`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
}

export async function findStudyResources(topic: string, language: string = 'English') {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find 3 high-quality educational resources (articles or videos) for the topic: ${topic}. Provide titles and URLs. Please provide the response and descriptions in ${language}.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text;
  } catch (error) {
    console.error("AI Search Error:", error);
    throw error;
  }
}

export async function generateVivaQuestions(notes: string) {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on these study notes, generate exactly 3 oral viva questions. 
      1. The first question should be very easy (basic concept).
      2. The second question should be medium difficulty (conceptual understanding).
      3. The third question should be a 'Tricky' application-based question.
      
      Return as a JSON array of objects with 'question' and 'difficulty' ('easy', 'medium', 'tricky').
      
      Notes: ${notes.substring(0, 2000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              difficulty: { type: Type.STRING }
            },
            required: ["question", "difficulty"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Viva Generation Error:", error);
    return [];
  }
}

export async function evaluateVivaResponse(question: string, response: string, difficulty: string) {
  try {
    const res: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the NexText AI Voice Tutor for School Vivas. 
      Question: ${question}
      Student's Response: ${response}
      Difficulty: ${difficulty}
      
      Evaluate the response. 
      1. Provide conversational feedback. Don't just say 'Correct' or 'Wrong'. 
         Use phrases like: 'Brilliant!', 'Oof, close! Let me give you a hint...', 'Think again, what happened before that?'.
      2. Provide a numerical score for this specific answer (0-10).
      
      Return as a JSON object with 'feedback' and 'score'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING },
            score: { type: Type.NUMBER }
          },
          required: ["feedback", "score"]
        }
      }
    });
    return JSON.parse(res.text);
  } catch (error) {
    console.error("Viva Evaluation Error:", error);
    return { feedback: "I couldn't quite hear that, but let's move on!", score: 5 };
  }
}
