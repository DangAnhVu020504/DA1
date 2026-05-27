import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) {}

    @Post('chat')
    async chat(@Body() body: { message: string }) {
        const response = await this.aiService.askAssistant(body.message);
        return { response };
    }
}
