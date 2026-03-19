import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const customFileName = formData.get('fileName') as string | null; // 自定义文件名（不含扩展名）
    const overwrite = formData.get('overwrite') === 'true'; // 是否覆盖同名文件

    if (!file) {
      return NextResponse.json(
        { error: '未选择文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '仅支持 JPG、PNG、GIF、WebP 格式的图片' },
        { status: 400 }
      );
    }

    // 验证文件大小（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '图片大小不能超过 5MB' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 生成文件名
    let fileName: string;
    if (customFileName) {
      // 使用自定义文件名，格式：products/自定义文件名.扩展名
      const ext = file.name.split('.').pop();
      fileName = `products/${customFileName}.${ext}`;
    } else {
      // 默认生成随机文件名
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const ext = file.name.split('.').pop();
      fileName = `products/${timestamp}_${random}.${ext}`;
    }

    console.log('上传图片 - 文件名:', fileName, '覆盖模式:', overwrite);

    // 上传到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: file.type,
    });

    // 生成签名 URL（有效期7天）
    const imageUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 604800, // 7天
    });

    return NextResponse.json({
      success: true,
      data: {
        key: fileKey,
        url: imageUrl,
        fileName: fileName,
      },
    });
  } catch (error) {
    console.error('图片上传失败:', error);
    return NextResponse.json(
      { error: '图片上传失败，请重试' },
      { status: 500 }
    );
  }
}
