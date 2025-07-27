import json
import boto3

br = boto3.client("bedrock-runtime", region_name="ap-northeast-1")

# CORS 用ヘッダーをまとめて定義
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",               # 本番は許可ドメインを絞ってください
    "Access-Control-Allow-Methods": "POST, OPTIONS", 
    "Access-Control-Allow-Headers": "Content-Type"
}

def lambda_handler(event, context):
    # API Gateway のプリフライト OPTIONS に対応
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": ""  # ボディは不要
        }

    # リクエストボディの取得（POST リクエスト）
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        body = {}

    user_msg = body.get("message", "こんにちは")

    # Claude に渡すペイロードを構築
    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "messages": [
            {"role": "assistant", "content": "あなたは親切なアシスタントです。日本語で回答してください。"},
            {"role": "user",      "content": user_msg}
        ],
        "max_tokens": 256
    }

    # Bedrock Claude 呼び出し
    res = br.invoke_model(
        modelId="anthropic.claude-3-haiku-20240307-v1:0",
        contentType="application/json",
        accept="application/json",
        body=json.dumps(payload)
    )

    reply = json.loads(res["body"].read())["content"][0]["text"]

    # AI レスポンス返却
    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps({"reply": reply})
    }
