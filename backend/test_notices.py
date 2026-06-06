import asyncio
import motor.motor_asyncio
import json

client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017')
db = client.signage_os

async def main():
    docs = await db.notices.find({}, {'_id':0}).to_list(10)
    print(json.dumps(docs, indent=2))

if __name__ == '__main__':
    asyncio.run(main())
