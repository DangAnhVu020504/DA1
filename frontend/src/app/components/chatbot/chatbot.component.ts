import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
    time: string;
}

@Component({
    selector: 'app-chatbot',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chatbot.component.html',
    styleUrl: './chatbot.component.css'
})
export class ChatbotComponent implements AfterViewChecked {
    @ViewChild('chatBody') chatBody!: ElementRef;

    isOpen = false;
    isTyping = false;
    userInput = '';
    messages: ChatMessage[] = [];
    private apiUrl = 'http://localhost:3000/ai/chat';
    private shouldScroll = false;

    constructor(private http: HttpClient) {}

    ngAfterViewChecked() {
        if (this.shouldScroll) {
            this.scrollToBottom();
            this.shouldScroll = false;
        }
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
    }

    sendSuggestion(text: string) {
        this.userInput = text;
        this.sendMessage();
    }

    sendMessage() {
        const text = this.userInput.trim();
        if (!text || this.isTyping) return;

        this.messages.push({
            sender: 'user',
            text: text,
            time: this.getCurrentTime()
        });

        this.userInput = '';
        this.isTyping = true;
        this.shouldScroll = true;

        this.http.post<{ response: string }>(this.apiUrl, { message: text }).subscribe({
            next: (res) => {
                this.isTyping = false;
                this.messages.push({
                    sender: 'bot',
                    text: res.response,
                    time: this.getCurrentTime()
                });
                this.shouldScroll = true;
            },
            error: () => {
                this.isTyping = false;
                this.messages.push({
                    sender: 'bot',
                    text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau hoặc liên hệ hotline 1900 1881.',
                    time: this.getCurrentTime()
                });
                this.shouldScroll = true;
            }
        });
    }

    formatMessage(text: string): string {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }

    private getCurrentTime(): string {
        const now = new Date();
        return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    }

    private scrollToBottom() {
        if (this.chatBody) {
            const el = this.chatBody.nativeElement;
            el.scrollTop = el.scrollHeight;
        }
    }
}
