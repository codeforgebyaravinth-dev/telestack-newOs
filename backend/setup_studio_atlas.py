import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import datetime
import re
import uuid

def _category_slug(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

async def main():
    url = 'mongodb+srv://codeforgebyaravinth_db_user:W9WZewvFAA0YmKrs@auracluster.egxxqle.mongodb.net/?retryWrites=true&w=majority'
    mc = AsyncIOMotorClient(url)
    db = mc['signage']

    c = await db.clients.find_one({'email': 'codeforgebyaravinth@gmail.com'}, {'_id': 0, 'id': 1, 'email': 1, 'name': 1})
    if not c:
        print("Client not found!")
        return
    cid = c['id']
    print(f"Found client: {c.get('name')} (ID: {cid})")

    # Update client domain & details
    await db.clients.update_one(
        {'id': cid},
        {'$set': {
            'custom_booking_domain': 'stardigitalstudios.telestack.dev',
            'custom_booking_domain_status': 'active',
            'public_booking_slug': 'stardigitalstudios',
            'vertical': 'studio'
        }}
    )
    print("Client updated with custom domain: stardigitalstudios.telestack.dev and vertical: studio")

    # Delete any existing broken/null-slug categories for this client
    deleted = await db.product_categories.delete_many({'client_id': cid})
    print(f"Deleted old categories for client: {deleted.deleted_count}")

    # Seed fresh studio categories with proper slugs
    category_names = [
        "Customised Gifts",
        "Photo Frames",
        "Digital Printing",
        "Custom Mugs & Pillows",
        "Canvas & Acrylic Prints",
        "Passport & ID Photos"
    ]

    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    inserted_cats = []
    for idx, name in enumerate(category_names):
        cat_id = str(uuid.uuid4())
        slug = _category_slug(name)
        cat_doc = {
            "id": cat_id,
            "client_id": cid,
            "name": name,
            "slug": slug,
            "parent_id": None,
            "sort_order": idx,
            "is_active": True,
            "created_at": now
        }
        await db.product_categories.insert_one(cat_doc)
        inserted_cats.append((cat_id, name, slug))
        print(f"Inserted category: {name} (ID: {cat_id}, slug: {slug})")

    # Verify categories in database
    count = await db.product_categories.count_documents({'client_id': cid})
    print(f"Total categories now in Atlas for client {cid}: {count}")

    # Check client verification
    updated_client = await db.clients.find_one({'id': cid}, {'_id': 0, 'custom_booking_domain': 1, 'public_booking_slug': 1, 'vertical': 1})
    print("Updated client document in Atlas:", updated_client)

if __name__ == '__main__':
    asyncio.run(main())
