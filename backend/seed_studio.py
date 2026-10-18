import asyncio
import motor.motor_asyncio
import uuid
import bcrypt

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://127.0.0.1:27017')
    db = client['signage']
    cid = '7505e9fd-8ef2-4636-aff6-59baa8cb3d42'

    pw_hash = bcrypt.hashpw(b'studio123', bcrypt.gensalt()).decode()

    update_doc = {
        'name': 'STAR DIGITAL STUDIOS VIDEOS',
        'password_hash': pw_hash,
        'phone': '8489809605',
        'address': 'Kai Kalathur, Perambalur Main Road, Near INDIA 1 ATM, Kai Kalathur, Perambalur District, Tamil Nadu - 621117',
        'studio_profile': {
            'headline': 'OUR SERVICES',
            'tagline': 'Capturing Moments • Creating Memories • Customising Gifts',
            'motto': 'Your Moments Our Passion ♡',
            'description': 'Professional photography, creative videography, premium photo printing and personalised gifts — all in one place.',
            'founder_name': 'VK. BOOPATHI',
            'founder_title': 'FOUNDER & CEO STAR GROUPS',
            'founder_bio': 'VK. BOOPATHI is the Founder & CEO of STAR GROUPS and STAR DIGITAL STUDIOS VIDEOS – CUSTOMISED GIFTS. With a passion for photography, creativity and modern technology, he built the brand to provide quality photography, videography, personalised gifts, photo frames and printing services under one platform.',
            'founder_quote': 'To build a trusted creative brand that combines photography, technology, personalised products and professional customer service under one platform.',
            'established': '2023',
            'happy_customers': '1000+',
            'quality_services': '100% Quality Guaranteed',
            'expansion': 'Expanding Across Tamil Nadu',
            'location_full': 'Kai Kalathur, Perambalur Main Road, Near INDIA 1 ATM, Kai Kalathur, Perambalur District, Tamil Nadu - 621117',
            'phone': '8489809605',
            'whatsapp': '8489809605',
            'hours_weekday': '9:15 AM – 9:45 PM',
            'hours_lunch': '1:45 PM – 3:45 PM',
            'hours_sunday': '9:15 AM – 9:45 PM (Shop Open)',
            'hours': '9:15 AM - 9:45 PM',
            'is_open': True,
            'slot_minutes': 60,
            'services': [
                {
                    'id': 'srv-wedding',
                    'name': 'Wedding Photography',
                    'category_label': 'Traditional • Candid Outdoor',
                    'price': 45000,
                    'duration_mins': 480,
                    'description': 'Beautifully capturing your special day with traditional and candid photography.',
                    'deliverables': 'Traditional Photography, Candid Photography, Pre & Post Wedding Shoots, Album Design & Printing',
                    'image_url': 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
                    'active': True
                },
                {
                    'id': 'srv-video',
                    'name': 'Videography & Cinematography',
                    'category_label': 'Traditional • Cinematic Events',
                    'price': 35000,
                    'duration_mins': 360,
                    'description': 'Cinematic storytelling to make your moments last forever.',
                    'deliverables': 'Traditional Video, Cinematic Video, Event Coverage, LED Wall Live Streaming',
                    'image_url': 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=800&q=80',
                    'active': True
                },
                {
                    'id': 'srv-drone',
                    'name': 'Drone Videography',
                    'category_label': 'Aerial • Events Weddings',
                    'price': 15000,
                    'duration_mins': 180,
                    'description': 'Aerial shots to give a stunning view of your events.',
                    'deliverables': 'Wedding Drone Shoot, Event Coverage, Aerial Cinematic Shots, Professional Drone Team',
                    'image_url': 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
                    'active': True
                },
                {
                    'id': 'srv-studio',
                    'name': 'Studio Services',
                    'category_label': 'Passport • Printing Restoration',
                    'price': 500,
                    'duration_mins': 30,
                    'description': 'All your photo and printing needs with professional quality.',
                    'deliverables': 'Passport Size Photos, Photo Printing, Photo Restoration, Lamination & Toner Refilling',
                    'image_url': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
                    'active': True
                },
                {
                    'id': 'srv-gifts',
                    'name': 'Customised Gifts',
                    'category_label': 'Mugs • Pillows Keychains • T-Shirts',
                    'price': 399,
                    'duration_mins': 60,
                    'description': 'Turn your photos into beautiful and personalised gifts.',
                    'deliverables': 'Mugs & Magic Mugs, Pillows & Magic Pillows, Key Chains & T-Shirts, Caps & More',
                    'image_url': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
                    'active': True
                },
                {
                    'id': 'srv-frames',
                    'name': 'Photo Frames & Printing',
                    'category_label': 'Premium Frames Album Printing',
                    'price': 899,
                    'duration_mins': 60,
                    'description': 'Premium quality frames and printing services for all occasions.',
                    'deliverables': 'Photo Frames (All Sizes), Album Printing, Invitation Cards, Digital Printing Services',
                    'image_url': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
                    'active': True
                }
            ]
        }
    }
    await db.clients.update_one({'id': cid}, {'$set': update_doc})
    print('Client profile updated!')

    # Seed products
    products = [
        {
            'id': 'prod-magic-mug',
            'client_id': cid,
            'name': 'Customised Magic Coffee Mug',
            'category': 'Customised Gifts',
            'price': 399.0,
            'stock': 100,
            'description': 'Colour-changing ceramic mug that reveals your high-resolution custom photo when hot liquid is poured. Microwave and dishwasher safe.',
            'image_url': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
            'customizable': True
        },
        {
            'id': 'prod-magic-pillow',
            'client_id': cid,
            'name': 'Heart Sequins Magic Pillow',
            'category': 'Customised Gifts',
            'price': 799.0,
            'stock': 50,
            'description': 'Sparkling reversible sequin heart pillow with your favourite couple or family photo printed on one side. Ultra-soft velvet back.',
            'image_url': 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
            'customizable': True
        },
        {
            'id': 'prod-wood-frame',
            'client_id': cid,
            'name': 'Premium Matte Wooden Photo Frame (12x18)',
            'category': 'Photo Frames',
            'price': 1299.0,
            'stock': 80,
            'description': 'Handcrafted solid teakwood frame with unbreakable matte lamination and museum-grade archival photo print.',
            'image_url': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
            'customizable': True
        },
        {
            'id': 'prod-acrylic-frame',
            'client_id': cid,
            'name': 'Ultra HD Acrylic Floating Wall Frame (16x24)',
            'category': 'Photo Frames',
            'price': 2499.0,
            'stock': 40,
            'description': 'Glossy 5mm imported acrylic print with bevelled diamond-polished edges and stainless-steel wall mounts.',
            'image_url': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
            'customizable': True
        },
        {
            'id': 'prod-keychain',
            'client_id': cid,
            'name': 'Metal & Wood Customised Keychain',
            'category': 'Customised Gifts',
            'price': 149.0,
            'stock': 200,
            'description': 'Double-sided laser engraved metallic and wooden keychain with your custom portrait or quote.',
            'image_url': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
            'customizable': True
        },
        {
            'id': 'prod-tshirt',
            'client_id': cid,
            'name': 'Personalised 100% Cotton Printed T-Shirt',
            'category': 'Customised Gifts',
            'price': 599.0,
            'stock': 120,
            'description': 'Bio-washed 220 GSM pure cotton tee with vibrant DTF photography printing for birthdays and family occasions.',
            'image_url': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
            'customizable': True
        }
    ]

    for p in products:
        await db.products.update_one({'id': p['id']}, {'$set': p}, upsert=True)
    print('Products seeded successfully!')

if __name__ == '__main__':
    asyncio.run(main())
