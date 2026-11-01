"""
services/restaurant_service.py
Rich mock restaurant data + search / availability helpers.
"""

from __future__ import annotations
import math
from typing import Optional

# ---------------------------------------------------------------------------
# Mock restaurant dataset (18 restaurants across 8 Indian cities)
# ---------------------------------------------------------------------------
RESTAURANTS: list[dict] = [
    # ── Delhi ──────────────────────────────────────────────────────────────
    {
        "id": "RST001",
        "name": "Bukhara – ITC Maurya",
        "city": "Delhi",
        "cuisine": ["North Indian", "Tandoor"],
        "address": "Sardar Patel Marg, Diplomatic Enclave, New Delhi – 110021",
        "rating": 4.8,
        "price_for_two": 5000,
        "amenities": ["Valet Parking", "Private Dining Room",
                      "Live Tandoor Show", "Outdoor Seating"],
        "images": [
            "https://picsum.photos/seed/RST001a/800/500",
            "https://picsum.photos/seed/RST001b/800/500",
        ],
        "description": (
            "World-famous for its slow-cooked Dal Bukhara and the theatrical open "
            "tandoor kitchen, Bukhara has hosted world leaders and celebrities for "
            "over four decades. A timeless Delhi institution."
        ),
        "opening_hours": {"open": "12:30", "close": "23:45"},
        "available": True,
        "coordinates": {"lat": 28.5983, "lng": 77.1701},
    },
    {
        "id": "RST002",
        "name": "Indian Accent",
        "city": "Delhi",
        "cuisine": ["Modern Indian", "Contemporary"],
        "address": "The Lodhi, Lodhi Road, New Delhi – 110003",
        "rating": 4.9,
        "price_for_two": 7000,
        "amenities": ["Valet Parking", "Wine Pairing", "Chef's Table",
                      "Outdoor Seating", "Tasting Menu"],
        "images": [
            "https://picsum.photos/seed/RST002a/800/500",
        ],
        "description": (
            "Repeatedly ranked among Asia's 50 Best Restaurants, Indian Accent "
            "reinvents Indian cuisine using global techniques and local ingredients. "
            "Chef Manish Mehrotra's tasting menu is unmissable."
        ),
        "opening_hours": {"open": "12:00", "close": "23:00"},
        "available": True,
        "coordinates": {"lat": 28.5931, "lng": 77.2219},
    },
    {
        "id": "RST003",
        "name": "Paranthe Wali Gali – Old Delhi",
        "city": "Delhi",
        "cuisine": ["Street Food", "North Indian"],
        "address": "Gali Paranthe Wali, Chandni Chowk, Old Delhi – 110006",
        "rating": 4.4,
        "price_for_two": 400,
        "amenities": ["Takeaway"],
        "images": [
            "https://picsum.photos/seed/RST003a/800/500",
        ],
        "description": (
            "A legendary street-food lane in Chandni Chowk serving 150 varieties of "
            "stuffed paranthas since 1875. The ultimate Delhi heritage food experience."
        ),
        "opening_hours": {"open": "07:00", "close": "22:00"},
        "available": True,
        "coordinates": {"lat": 28.6562, "lng": 77.2300},
    },

    # ── Mumbai ─────────────────────────────────────────────────────────────
    {
        "id": "RST004",
        "name": "Wasabi by Morimoto – Taj Mahal Palace",
        "city": "Mumbai",
        "cuisine": ["Japanese", "Asian Fusion"],
        "address": "Apollo Bunder, Colaba, Mumbai – 400001",
        "rating": 4.7,
        "price_for_two": 8000,
        "amenities": ["Valet Parking", "Sea View", "Sake Bar",
                      "Private Dining", "Tasting Menu"],
        "images": [
            "https://picsum.photos/seed/RST004a/800/500",
            "https://picsum.photos/seed/RST004b/800/500",
        ],
        "description": (
            "Iron Chef Masaharu Morimoto's signature restaurant at the Taj Mahal "
            "Palace offers premium Japanese cuisine with panoramic views of the "
            "Gateway of India."
        ),
        "opening_hours": {"open": "12:30", "close": "23:30"},
        "available": True,
        "coordinates": {"lat": 18.9217, "lng": 72.8332},
    },
    {
        "id": "RST005",
        "name": "Leopold Café",
        "city": "Mumbai",
        "cuisine": ["Multi-cuisine", "Continental", "Indian"],
        "address": "Shahid Bhagat Singh Road, Colaba, Mumbai – 400001",
        "rating": 4.2,
        "price_for_two": 1200,
        "amenities": ["Outdoor Seating", "Bar", "Live Music Weekends"],
        "images": [
            "https://picsum.photos/seed/RST005a/800/500",
        ],
        "description": (
            "Opened in 1871, Leopold Café is Colaba's most beloved hangout — a "
            "sprawling, lively space famous for cold beers, hearty food, and the "
            "stories embedded in its bullet-marked walls."
        ),
        "opening_hours": {"open": "07:30", "close": "00:30"},
        "available": True,
        "coordinates": {"lat": 18.9224, "lng": 72.8318},
    },
    {
        "id": "RST006",
        "name": "Trishna",
        "city": "Mumbai",
        "cuisine": ["Seafood", "Coastal Indian"],
        "address": "7 Sai Baba Marg, Kala Ghoda, Mumbai – 400001",
        "rating": 4.6,
        "price_for_two": 3500,
        "amenities": ["Air Conditioning", "Wine List", "Private Dining"],
        "images": [
            "https://picsum.photos/seed/RST006a/800/500",
        ],
        "description": (
            "A Mumbai legend since 1981. Trishna's butter-garlic crab is arguably "
            "the city's most coveted dish. Intimate, unpretentious, and flawlessly "
            "fresh every time."
        ),
        "opening_hours": {"open": "12:00", "close": "23:30"},
        "available": True,
        "coordinates": {"lat": 18.9310, "lng": 72.8337},
    },

    # ── Jaipur ─────────────────────────────────────────────────────────────
    {
        "id": "RST007",
        "name": "Suvarna Mahal – Rambagh Palace",
        "city": "Jaipur",
        "cuisine": ["Rajasthani", "Mughal", "Continental"],
        "address": "Bhawani Singh Rd, Rambagh, Jaipur – 302005",
        "rating": 4.8,
        "price_for_two": 6500,
        "amenities": ["Royal Dining Room", "Live Rajasthani Music",
                      "Valet Parking", "Dress Code"],
        "images": [
            "https://picsum.photos/seed/RST007a/800/500",
            "https://picsum.photos/seed/RST007b/800/500",
        ],
        "description": (
            "Dine in the former ballroom of the Maharaja in opulent surroundings. "
            "Suvarna Mahal serves royal Rajasthani and Mughal specialities with "
            "live folk music and an impeccable, courtly service."
        ),
        "opening_hours": {"open": "19:00", "close": "23:00"},
        "available": True,
        "coordinates": {"lat": 26.8890, "lng": 75.8069},
    },
    {
        "id": "RST008",
        "name": "Laxmi Mishthan Bhandar (LMB)",
        "city": "Jaipur",
        "cuisine": ["Rajasthani", "Sweets", "Vegetarian"],
        "address": "Johari Bazaar, Jaipur – 302003",
        "rating": 4.3,
        "price_for_two": 600,
        "amenities": ["Takeaway", "Sweet Shop", "Air Conditioning"],
        "images": [
            "https://picsum.photos/seed/RST008a/800/500",
        ],
        "description": (
            "An institution since 1954, LMB is Jaipur's go-to for authentic "
            "Rajasthani thali, Dal Baati Churma, and the finest sweets in the "
            "Pink City."
        ),
        "opening_hours": {"open": "08:00", "close": "23:00"},
        "available": True,
        "coordinates": {"lat": 26.9189, "lng": 75.8278},
    },

    # ── Bangalore ──────────────────────────────────────────────────────────
    {
        "id": "RST009",
        "name": "Karavalli – Gateway Hotel",
        "city": "Bangalore",
        "cuisine": ["Coastal Karnatakan", "Seafood", "Konkani"],
        "address": "66 Residency Rd, Bengaluru – 560025",
        "rating": 4.7,
        "price_for_two": 3000,
        "amenities": ["Garden Seating", "Air Conditioning",
                      "Wine List", "Valet Parking"],
        "images": [
            "https://picsum.photos/seed/RST009a/800/500",
            "https://picsum.photos/seed/RST009b/800/500",
        ],
        "description": (
            "Karavalli transports guests to the coastal homes of Karnataka, Kerala, "
            "and Goa. With a thatched-roof ambience and recipes passed down through "
            "generations, it is Bengaluru's finest coastal dining experience."
        ),
        "opening_hours": {"open": "12:30", "close": "15:00", "dinner_open": "19:00", "close2": "23:00"},
        "available": True,
        "coordinates": {"lat": 12.9716, "lng": 77.5946},
    },
    {
        "id": "RST010",
        "name": "Brahmin's Coffee Bar",
        "city": "Bangalore",
        "cuisine": ["South Indian", "Breakfast", "Vegetarian"],
        "address": "Next to Shankaramutt, Basavanagudi, Bengaluru – 560004",
        "rating": 4.5,
        "price_for_two": 200,
        "amenities": ["Takeaway"],
        "images": [
            "https://picsum.photos/seed/RST010a/800/500",
        ],
        "description": (
            "A beloved Bengaluru institution serving piping-hot idlis, vadas, and "
            "filter coffee since 1965. Locals queue from 6 am for the best "
            "traditional South Indian breakfast in the city."
        ),
        "opening_hours": {"open": "06:30", "close": "11:00"},
        "available": True,
        "coordinates": {"lat": 12.9437, "lng": 77.5731},
    },
    {
        "id": "RST011",
        "name": "The Black Pearl",
        "city": "Bangalore",
        "cuisine": ["European", "Bar & Grill", "Continental"],
        "address": "3rd Floor, 13 Church Street, Bengaluru – 560001",
        "rating": 4.4,
        "price_for_two": 2200,
        "amenities": ["Bar", "Live Music", "Outdoor Terrace",
                      "Happy Hour"],
        "images": [
            "https://picsum.photos/seed/RST011a/800/500",
        ],
        "description": (
            "A nautically themed gastro-pub on Church Street with craft cocktails, "
            "extensive European-inspired mains, and live music on weekends."
        ),
        "opening_hours": {"open": "12:00", "close": "01:00"},
        "available": True,
        "coordinates": {"lat": 12.9765, "lng": 77.6082},
    },

    # ── Goa ────────────────────────────────────────────────────────────────
    {
        "id": "RST012",
        "name": "Vinayak Family Restaurant",
        "city": "Goa",
        "cuisine": ["Goan", "Seafood", "Fish Curry"],
        "address": "Near Holiday Street, Assagao, North Goa – 403507",
        "rating": 4.5,
        "price_for_two": 1000,
        "amenities": ["Outdoor Seating", "Family Friendly", "Takeaway"],
        "images": [
            "https://picsum.photos/seed/RST012a/800/500",
        ],
        "description": (
            "A no-frills village eatery beloved by locals and savvy travellers alike. "
            "Their Goan fish curry, prawn balchão, and fresh-catch grills are "
            "simply unbeatable at any price point."
        ),
        "opening_hours": {"open": "11:00", "close": "22:00"},
        "available": True,
        "coordinates": {"lat": 15.5797, "lng": 73.8204},
    },
    {
        "id": "RST013",
        "name": "Gunpowder Goa",
        "city": "Goa",
        "cuisine": ["South Indian", "Kerala", "Coorg"],
        "address": "Vagator Road, Assagao, North Goa – 403507",
        "rating": 4.6,
        "price_for_two": 1800,
        "amenities": ["Garden Seating", "Air Conditioning", "BYOB"],
        "images": [
            "https://picsum.photos/seed/RST013a/800/500",
            "https://picsum.photos/seed/RST013b/800/500",
        ],
        "description": (
            "Tucked inside a heritage Portuguese villa, Gunpowder serves bold "
            "South Indian and Coorgi specialities in a romantic, garden setting — "
            "with a BYOB policy that's loved by regulars."
        ),
        "opening_hours": {"open": "12:00", "close": "22:30"},
        "available": True,
        "coordinates": {"lat": 15.5834, "lng": 73.7986},
    },

    # ── Agra ───────────────────────────────────────────────────────────────
    {
        "id": "RST014",
        "name": "Pinch of Spice",
        "city": "Agra",
        "cuisine": ["Mughlai", "North Indian", "Continental"],
        "address": "10/1 Opposite Hotel Atithi, Fatehabad Road, Agra – 282001",
        "rating": 4.5,
        "price_for_two": 1400,
        "amenities": ["Air Conditioning", "Parking", "Family Section"],
        "images": [
            "https://picsum.photos/seed/RST014a/800/500",
        ],
        "description": (
            "Agra's favourite multi-cuisine restaurant, famed for rich Mughlai "
            "preparations, melt-in-the-mouth kebabs, and a warm, family-friendly "
            "atmosphere near the Taj Mahal."
        ),
        "opening_hours": {"open": "11:00", "close": "23:00"},
        "available": True,
        "coordinates": {"lat": 27.1540, "lng": 78.0400},
    },

    # ── Chennai ────────────────────────────────────────────────────────────
    {
        "id": "RST015",
        "name": "Annalakshmi Restaurant",
        "city": "Chennai",
        "cuisine": ["South Indian Vegetarian", "Tamil"],
        "address": "804 Anna Salai, Chennai – 600002",
        "rating": 4.6,
        "price_for_two": 800,
        "amenities": ["Air Conditioning", "Pay-What-You-Wish",
                      "Cultural Performances"],
        "images": [
            "https://picsum.photos/seed/RST015a/800/500",
        ],
        "description": (
            "A unique restaurant run entirely by volunteers. Annalakshmi serves "
            "exquisite South Indian vegetarian cuisine on a pay-what-you-wish basis, "
            "with cultural performances and warm hospitality."
        ),
        "opening_hours": {"open": "11:30", "close": "15:00"},
        "available": True,
        "coordinates": {"lat": 13.0607, "lng": 80.2536},
    },

    # ── Hyderabad ──────────────────────────────────────────────────────────
    {
        "id": "RST016",
        "name": "Paradise Restaurant",
        "city": "Hyderabad",
        "cuisine": ["Hyderabadi", "Biryani", "Mughlai"],
        "address": "SD Road, Secunderabad, Hyderabad – 500003",
        "rating": 4.5,
        "price_for_two": 900,
        "amenities": ["Takeaway", "Air Conditioning", "Catering"],
        "images": [
            "https://picsum.photos/seed/RST016a/800/500",
            "https://picsum.photos/seed/RST016b/800/500",
        ],
        "description": (
            "Opened in 1953, Paradise is the definitive destination for Hyderabadi "
            "Dum Biryani. Over 65 years later, the original recipe and the nightly "
            "queues are both unchanged."
        ),
        "opening_hours": {"open": "11:00", "close": "23:00"},
        "available": True,
        "coordinates": {"lat": 17.4400, "lng": 78.4989},
    },
    {
        "id": "RST017",
        "name": "Chutneys",
        "city": "Hyderabad",
        "cuisine": ["South Indian", "Andhra", "Vegetarian"],
        "address": "Banjara Hills Rd No. 1, Banjara Hills, Hyderabad – 500034",
        "rating": 4.4,
        "price_for_two": 700,
        "amenities": ["Air Conditioning", "Family Friendly", "Takeaway"],
        "images": [
            "https://picsum.photos/seed/RST017a/800/500",
        ],
        "description": (
            "Hyderabad's beloved vegetarian chain famous for its extensive breakfast "
            "and tiffin menu. The medu vada, pesarattu, and ghee pongal draw crowds "
            "from all over the city every morning."
        ),
        "opening_hours": {"open": "07:00", "close": "23:00"},
        "available": True,
        "coordinates": {"lat": 17.4132, "lng": 78.4383},
    },
    {
        "id": "RST018",
        "name": "Farzi Café – Delhi",
        "city": "Delhi",
        "cuisine": ["Modern Indian", "Molecular Gastronomy", "Bar"],
        "address": "Ambience Mall, DLF Cyber Hub, Gurugram – 122002",
        "rating": 4.5,
        "price_for_two": 2500,
        "amenities": ["Bar", "Outdoor Seating", "Live Music",
                      "Valet Parking"],
        "images": [
            "https://picsum.photos/seed/RST018a/800/500",
        ],
        "description": (
            "Farzi Café blends molecular gastronomy with Indian street-food "
            "flavours. Signature dishes like the Pani Puri Shots and Truffle Naan "
            "keep the trendy, energetic crowd coming back."
        ),
        "opening_hours": {"open": "12:00", "close": "01:00"},
        "available": True,
        "coordinates": {"lat": 28.4941, "lng": 77.0891},
    },
]

# Quick lookup by id
_RESTAURANT_INDEX: dict[str, dict] = {r["id"]: r for r in RESTAURANTS}


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------

def search_restaurants(
    city: str,
    date: str = None,
    time: str = None,
    guests: int = 2,
) -> list[dict]:
    """
    Return restaurants matching city and availability criteria.

    Parameters
    ----------
    city   : Destination city (case-insensitive partial match)
    date   : Reservation date string (YYYY-MM-DD) — not used for mock filtering
    time   : Reservation time string ("HH:MM") — basic open/close check
    guests : Number of diners (no capacity filter in mock data, but kept for realism)
    """
    results = []
    city_lower = city.lower().strip() if city else ""

    for restaurant in RESTAURANTS:
        # City filter
        if city_lower and city_lower not in restaurant["city"].lower():
            continue

        # Availability flag
        if not restaurant.get("available", True):
            continue

        # Basic time check: if time provided, verify restaurant is open
        if time:
            try:
                req_h, req_m = map(int, time.split(":"))
                req_total = req_h * 60 + req_m
                open_h, open_m = map(int, restaurant["opening_hours"]["open"].split(":"))
                close_h, close_m = map(int, restaurant["opening_hours"]["close"].split(":"))
                open_total = open_h * 60 + open_m
                close_total = close_h * 60 + close_m
                if not (open_total <= req_total <= close_total):
                    continue
            except (ValueError, KeyError):
                pass  # Skip time filter if data is malformed

        results.append(restaurant)

    # Sort by rating descending, then price ascending
    results.sort(key=lambda r: (-r["rating"], r["price_for_two"]))
    return results


def get_restaurant_by_id(restaurant_id: str) -> dict | None:
    """Return a single restaurant by its ID, or None if not found."""
    return _RESTAURANT_INDEX.get(restaurant_id)


def check_table_availability(
    restaurant_id: str,
    date: str,
    time: str,
    guests: int,
) -> dict:
    """
    Check table availability for a restaurant.

    Returns a dict with keys: available (bool), message.
    """
    restaurant = get_restaurant_by_id(restaurant_id)
    if not restaurant:
        return {"available": False, "message": "Restaurant not found."}

    if not restaurant.get("available", True):
        return {
            "available": False,
            "message": f"Sorry, {restaurant['name']} is not accepting reservations.",
        }

    # Mock check: all open restaurants are available for ≤ 10 guests
    if guests > 10:
        return {
            "available": False,
            "message": (
                f"Tables for more than 10 guests require a special arrangement. "
                f"Please contact {restaurant['name']} directly."
            ),
        }

    return {
        "available": True,
        "message": (
            f"Table for {guests} at {restaurant['name']} on {date} at {time} "
            f"is available!"
        ),
        "restaurant": restaurant,
    }


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Compute the great-circle distance in kilometres between two coordinates."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lam = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def get_nearby_restaurants(
    lat: float,
    lng: float,
    radius_km: float = 5.0,
) -> list[dict]:
    """
    Return restaurants within radius_km of the given coordinates,
    sorted by distance ascending.
    """
    results = []
    for restaurant in RESTAURANTS:
        coords = restaurant.get("coordinates", {})
        r_lat = coords.get("lat")
        r_lng = coords.get("lng")
        if r_lat is None or r_lng is None:
            continue
        dist = _haversine_km(lat, lng, r_lat, r_lng)
        if dist <= radius_km:
            results.append({**restaurant, "distance_km": round(dist, 2)})

    results.sort(key=lambda r: r["distance_km"])
    return results
