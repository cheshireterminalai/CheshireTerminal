import nodemailer from 'nodemailer';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { config } from './config.js';
import { textGenerator } from './textGenerator.js';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

class EmailHandler {
    constructor() {
        this.outputDir = path.join(config.outputDir, 'email-responses');
        
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        this.imap = new Imap({
            user: config.email.username,
            password: config.email.password,
            host: config.email.imapServer,
            port: config.email.imapPort,
            tls: true,
            debug: console.log,
            tlsOptions: { 
                rejectUnauthorized: false,
                enableTrace: true
            },
            connTimeout: 30000,
            authTimeout: 15000
        });

        this.transporter = nodemailer.createTransport({
            host: config.email.smtpServer,
            port: config.email.smtpPort,
            secure: true,
            auth: {
                user: config.email.username,
                pass: config.email.password
            },
            debug: true,
            logger: true
        });

        this.imap.on('error', err => console.error('IMAP Error:', err));
        this.imap.on('end', () => console.log('IMAP connection ended'));
        this.imap.on('close', () => console.log('IMAP connection closed'));
        this.imap.on('alert', msg => console.log('IMAP Alert:', msg));
    }

    async generateResponse(email) {
        try {
            const prompt = `Please generate a professional email response to the following email:
Subject: ${email.subject}
From: ${email.from}
Content: ${email.body}

Generate a clear and concise response that addresses the main points of the email.`;

            const response = await fetch(`${config.llm.baseUrl}${config.llm.endpoints.chat}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "hugging-quants/llama-3.2-3b-instruct",
                    messages: [
                        { role: "system", content: "You are a professional email assistant. Write clear, concise, and helpful responses." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: -1,
                    stream: false
                })
            });

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error generating response:', error);
            throw error;
        }
    }

    async sendResponse(email, response) {
        try {
            const mailOptions = {
                from: config.email.username,
                to: email.from,
                subject: `Re: ${email.subject}`,
                text: response
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    saveResponse(email, response) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = path.join(this.outputDir, `response-${timestamp}.txt`);
        
        const content = `
Original Email:
From: ${email.from}
Subject: ${email.subject}
Content: ${email.body}

Generated Response:
${response}
`;

        fs.writeFileSync(filename, content);
        console.log(`Response saved to ${filename}`);
    }

    async testConnection() {
        console.log('Testing IMAP connection...');
        try {
            await this.connect();
            console.log('IMAP connection successful');
            
            console.log('Testing SMTP connection...');
            await this.transporter.verify();
            console.log('SMTP connection successful');
            
            return true;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        } finally {
            await this.disconnect();
        }
    }

    async connect() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout after 30 seconds'));
                this.imap.end();
            }, 30000);

            this.imap.once('ready', () => {
                clearTimeout(timeout);
                console.log('IMAP connection ready');
                resolve();
            });

            this.imap.once('error', (err) => {
                clearTimeout(timeout);
                console.error('IMAP connection error:', err);
                reject(err);
            });

            console.log('Initiating IMAP connection...');
            this.imap.connect();
        });
    }

    async disconnect() {
        return new Promise(resolve => {
            if (!this.imap.state || this.imap.state === 'disconnected') {
                resolve();
                return;
            }
            this.imap.once('end', () => {
                console.log('IMAP disconnected');
                resolve();
            });
            this.imap.end();
        });
    }

    async openInbox() {
        return new Promise((resolve, reject) => {
            this.imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    console.error('Error opening INBOX:', err);
                    reject(err);
                    return;
                }
                console.log('INBOX opened successfully');
                resolve(box);
            });
        });
    }

    async listUnreadEmails() {
        console.log('Starting to list unread emails...');
        try {
            await this.connect();
            console.log('Connection established, opening INBOX...');
            
            await this.openInbox();
            console.log('INBOX opened, searching for unread messages...');

            return new Promise((resolve, reject) => {
                this.imap.search(['UNSEEN'], (err, results) => {
                    if (err) {
                        console.error('Search error:', err);
                        reject(err);
                        return;
                    }
                    console.log('Search completed, found', results.length, 'unread messages');
                    resolve(results);
                });
            });
        } catch (error) {
            console.error('Error in listUnreadEmails:', error);
            throw error;
        }
    }

    async getEmailContent(uid) {
        console.log(`Fetching content for email ${uid}...`);
        try {
            if (!this.imap.state || this.imap.state === 'disconnected') {
                await this.connect();
                await this.openInbox();
            }

            return new Promise((resolve, reject) => {
                const fetch = this.imap.fetch(uid, {
                    bodies: '',
                    markSeen: false
                });

                fetch.on('message', (msg) => {
                    msg.on('body', async (stream) => {
                        try {
                            const parsed = await simpleParser(stream);
                            resolve({
                                id: uid,
                                subject: parsed.subject,
                                from: parsed.from.text,
                                to: parsed.to.text,
                                body: parsed.text,
                                date: parsed.date
                            });
                        } catch (error) {
                            reject(error);
                        }
                    });
                });

                fetch.once('error', reject);
                fetch.once('end', () => console.log('Fetch completed'));
            });
        } catch (error) {
            console.error('Error in getEmailContent:', error);
            throw error;
        }
    }
}

export const emailHandler = new EmailHandler();
