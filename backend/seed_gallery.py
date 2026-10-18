import asyncio
import motor.motor_asyncio
import uuid

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://127.0.0.1:27017")
    db = client["signage"]
    cid = "7505e9fd-8ef2-4636-aff6-59baa8cb3d42"

    gallery_items = [
        {
            "id": f"gal-{uuid.uuid4().hex[:8]}",
            "title": "Royal Heritage Muhurtham Ceremony",
            "category": "Wedding",
            "image_url": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
            "description": "Traditional Vedic wedding rituals with authentic golden lighting and heartfelt emotions.",
            "featured": True,
            "created_at": "2026-10-15T10:00:00Z"
        },
        {
            "id": f"gal-{uuid.uuid4().hex[:8]}",
            "title": "Candid Sunset Pre-Wedding Romance",
            "category": "Candid",
            "image_url": "https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=1200&q=80",
            "description": "Spontaneous laughter and natural silhouettes captured during the golden hour.",
            "featured": True,
            "created_at": "2026-10-15T11:00:00Z"
        },
        {
            "id": f"gal-{uuid.uuid4().hex[:8]}",
            "title": "Temple Gopuram Aerial Mandap Shot",
            "category": "Drone",
            "image_url": "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80",
            "description": "4K ultra-wide cinematic aerial coverage with our professional dual-operator drone setup.",
            "featured": True,
            "created_at": "2026-10-15T12:00:00Z"
        },
        {
            "id": f"gal-{uuid.uuid4().hex[:8]}",
            "title": "Customised Magic Mug & Velvet Cushion",
            "category": "Gifts",
            "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80",
            "description": "Personalized heat-sensitive magic mug revealing family photos with hot coffee.",
            "featured": True,
            "created_at": "2026-10-15T13:00:00Z"
        },
        {
            "id": f"gal-{uuid.uuid4().hex[:8]}",
            "title": "Baby First Birthday Studio Portrait",
            "category": "Studio",
            "image_url": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80",
            "description": "Playful and vibrant themed studio backdrop with softbox portrait lighting.",
            "featured": False,
            "created_at": "2026-10-15T14:00:00Z"
        },
        {
            "id": f"gal-{uuid.uuid4().hex[:8]}",
            "title": "Sony FX Cinema Rig In Action",
            "category": "Candid",
            "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
            "description": "Our senior cinematographers on a 3-axis motorized gimbal capturing stage entry.",
            "featured": False,
            "created_at": "2026-10-15T15:00:00Z"
        },
        {
            "id": f"gal-{uuid.uuid4().hex[:8]}",
            "title": "Teakwood Wall Art & Acrylic Framing",
            "category": "Gifts",
            "image_url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80",
            "description": "Handcrafted archival teakwood and crystal acrylic floating frame installation.",
            "featured": False,
            "created_at": "2026-10-15T16:00:00Z"
        },
        {
            "id": f"gal-{uuid.uuid4().hex[:8]}",
            "title": "Grand Floral Reception Stage",
            "category": "Wedding",
            "image_url": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
            "description": "Ultra-wide prime lens capture of magnificent stage flower decoration and couple entry.",
            "featured": True,
            "created_at": "2026-10-15T17:00:00Z"
        }
    ]

    res = await db.clients.update_one(
        {"id": cid},
        {"$set": {"studio_profile.gallery": gallery_items}}
    )
    print(f"Updated client studio_profile.gallery: matched={res.matched_count}, modified={res.modified_count}")

if __name__ == "__main__":
    asyncio.run(main())
