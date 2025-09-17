import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// AWS SES 클라이언트 설정
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export class SESService {
  private static instance: SESService;
  private fromEmail: string;

  private constructor() {
    this.fromEmail = process.env.AWS_SES_FROM_EMAIL || 'consult.on.official@gmail.com';
  }

  public static getInstance(): SESService {
    if (!SESService.instance) {
      SESService.instance = new SESService();
    }
    return SESService.instance;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // 개발 환경에서도 실제 이메일 발송 (테스트용)
      console.log(`📧 이메일 발송 시작: ${options.to}`);
      console.log(`From: ${this.fromEmail}`);
      console.log(`Subject: ${options.subject}`);

      const command = new SendEmailCommand({
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [options.to],
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: options.htmlBody,
              Charset: 'UTF-8',
            },
            ...(options.textBody && {
              Text: {
                Data: options.textBody,
                Charset: 'UTF-8',
              },
            }),
          },
        },
      });

      const response = await sesClient.send(command);
      console.log('✅ SES 이메일 발송 성공:', response.MessageId);
      return true;

    } catch (error) {
      console.error('❌ SES 이메일 발송 실패:', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, verificationCode: string): Promise<boolean> {
    const subject = 'ConsultOn 이메일 인증';
    const htmlBody = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ConsultOn 이메일 인증</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Malgun Gothic', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- 헤더 -->
          <div style="background-color: #2563eb; padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">ConsultOn</h1>
            <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px;">전문가 상담 플랫폼</p>
          </div>

          <!-- 메인 컨텐츠 -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">이메일 인증</h2>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              안녕하세요! ConsultOn 회원가입을 완료하기 위해 이메일 인증이 필요합니다.<br>
              아래 인증 코드를 입력하여 인증을 완료해주세요.
            </p>

            <!-- 인증 코드 박스 -->
            <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
              <p style="color: #475569; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">인증 코드</p>
              <div style="font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', monospace;">${verificationCode}</div>
              <p style="color: #94a3b8; font-size: 12px; margin: 15px 0 0 0;">이 코드는 10분 후에 만료됩니다</p>
            </div>

            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              본 이메일은 ConsultOn 회원가입 과정에서 자동으로 발송되었습니다.<br>
              만약 회원가입을 신청하지 않으셨다면 이 이메일을 무시해주세요.
            </p>
          </div>

          <!-- 푸터 -->
          <div style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
              © 2024 ConsultOn. All rights reserved.<br>
              <a href="https://consult-on.kr" style="color: #2563eb; text-decoration: none;">consult-on.kr</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
ConsultOn 이메일 인증

안녕하세요! ConsultOn 회원가입을 완료하기 위해 이메일 인증이 필요합니다.

인증 코드: ${verificationCode}

위 인증 코드를 입력하여 인증을 완료해주세요.
이 코드는 10분 후에 만료됩니다.

본 이메일은 ConsultOn 회원가입 과정에서 자동으로 발송되었습니다.
만약 회원가입을 신청하지 않으셨다면 이 이메일을 무시해주세요.

© 2024 ConsultOn. All rights reserved.
https://consult-on.kr
    `;

    return await this.sendEmail({
      to: email,
      subject,
      htmlBody,
      textBody,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const subject = 'ConsultOn 회원가입을 축하합니다!';
    const htmlBody = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ConsultOn 환영합니다</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Malgun Gothic', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- 헤더 -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">🎉 환영합니다!</h1>
            <p style="color: #e2e8f0; margin: 15px 0 0 0; font-size: 18px;">ConsultOn에 오신 것을 환영합니다</p>
          </div>

          <!-- 메인 컨텐츠 -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">안녕하세요, ${name}님!</h2>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
              ConsultOn 회원가입이 성공적으로 완료되었습니다.<br>
              이제 전문가들과의 상담을 통해 원하는 답변을 얻어보세요!
            </p>

            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 25px; margin: 25px 0;">
              <h3 style="color: #0369a1; margin: 0 0 15px 0; font-size: 18px;">✨ ConsultOn에서 할 수 있는 일들</h3>
              <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>다양한 분야의 전문가와 1:1 상담</li>
                <li>AI 채팅을 통한 즉시 답변</li>
                <li>커뮤니티에서 지식 공유</li>
                <li>맞춤형 전문가 추천</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 35px 0;">
              <a href="https://consult-on.kr/dashboard"
                 style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none;
                        padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                지금 시작하기
              </a>
            </div>

            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
              궁금한 점이 있으시면 언제든지 <a href="mailto:consult.on.official@gmail.com" style="color: #2563eb;">고객지원팀</a>으로 연락해주세요.
            </p>
          </div>

          <!-- 푸터 -->
          <div style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
              © 2024 ConsultOn. All rights reserved.<br>
              <a href="https://consult-on.kr" style="color: #2563eb; text-decoration: none;">consult-on.kr</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject,
      htmlBody,
    });
  }
}

// 싱글톤 인스턴스 내보내기
export const emailService = SESService.getInstance();