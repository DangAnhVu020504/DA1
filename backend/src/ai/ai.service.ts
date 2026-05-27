import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiService {
    private ai: GoogleGenAI;
    private systemPrompt = `Bạn là "Trợ lý BĐS VIP" - trợ lý ảo thân thiện và chuyên nghiệp của hệ thống giao dịch bất động sản BatDongSanVIP. 

Nhiệm vụ của bạn:
- Tư vấn về mua bán, cho thuê nhà đất, căn hộ, biệt thự, đất nền.
- Hướng dẫn người dùng sử dụng các tính năng của hệ thống: đăng tin, tìm kiếm, đặt lịch hẹn xem nhà, quản lý bất động sản.
- Cung cấp thông tin về thị trường bất động sản, pháp lý, thủ tục mua bán.
- Giải đáp thắc mắc về tài khoản, đăng nhập, đăng ký.

Quy tắc trả lời:
- Trả lời bằng tiếng Việt, ngắn gọn, lịch sự và dễ hiểu.
- Sử dụng emoji phù hợp để tạo sự thân thiện.
- Nếu câu hỏi nằm ngoài phạm vi bất động sản, lịch sự từ chối và hướng người dùng quay lại chủ đề BĐS.
- Không bịa đặt thông tin về giá cả cụ thể nếu không chắc chắn.`;

    constructor() {
        this.ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY || '',
        });
    }

    async askAssistant(userMessage: string): Promise<string> {
        const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
        for (const model of models) {
            try {
                console.log(`Trying model: ${model}`);
                const response = await this.ai.models.generateContent({
                    model: model,
                    contents: userMessage,
                    config: {
                        systemInstruction: this.systemPrompt,
                        maxOutputTokens: 1024,
                        temperature: 0.7,
                    },
                });
                console.log(`Success with model: ${model}`);
                return response.text || 'Xin lỗi, tôi không thể xử lý yêu cầu này lúc này.';
            } catch (error: unknown) {
                const err = error as { status?: number | string; message?: string };
                console.error(`Model ${model} failed:`, err?.status || err?.message || error);
            }
        }
        return 'Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ hotline 1900 1881.';
    }
}
