import json
import boto3

br = boto3.client("bedrock-runtime", region_name="ap-northeast-1")


def lambda_handler(event, context):
    # 1. リクエストボディの取得（API Gateway or テストイベントに対応）
    if isinstance(event, dict) and "body" in event:
        try:
            body = json.loads(event["body"] or "{}")
        except json.JSONDecodeError:
            body = {}
    else:
        body = event

    user_msg = body.get("message", "こんにちは")

    # 2. Claudeに渡すペイロードを構築
    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "messages": [
            {
                "role": "assistant",
                "content": "あなたは親切なアシスタントです。日本語で回答してください。",
            },
            {"role": "user", "content": user_msg},
        ],
        "max_tokens": 256,
    }

    # 3. Bedrock Claudeを呼び出し
    res = br.invoke_model(
        modelId="anthropic.claude-3-haiku-20240307-v1:0",
        contentType="application/json",
        accept="application/json",
        body=json.dumps(payload),
    )

    reply = json.loads(res["body"].read())["content"][0]["text"]

    # 4. CORS対応のためのレスポンスヘッダーを追加（重要！！）
    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",  # ← どこからでも受け付ける（本番は限定推奨）
            "Access-Control-Allow-Methods": "POST, OPTIONS",  # ← OPTIONS メソッドも明記
            "Access-Control-Allow-Headers": "Content-Type",  # ← Content-Type などを許可
        },
        "body": json.dumps({"reply": reply}),
    }
