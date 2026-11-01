"""
services/hotel_service.py
Rich mock hotel data + search / availability helpers.
"""

from __future__ import annotations
from typing import Optional

# ---------------------------------------------------------------------------
# Mock hotel dataset (18 hotels across 8 Indian cities)
# ---------------------------------------------------------------------------
HOTELS: list[dict] = [
    # ── Delhi ──────────────────────────────────────────────────────────────
    {
        "id": "HTL001",
        "name": "The Imperial New Delhi",
        "city": "Delhi",
        "location": "Janpath, Connaught Place, New Delhi",
        "address": "Janpath Lane, Connaught Place, New Delhi – 110001",
        "star_rating": 5,
        "price_per_night": 18500,
        "amenities": ["WiFi", "Swimming Pool", "Spa", "Gym", "Valet Parking",
                      "Airport Shuttle", "Fine Dining", "Bar", "Business Centre",
                      "Concierge", "24-hr Room Service"],
        "images": [
            "https://picsum.photos/seed/HTL001a/800/500",
            "https://picsum.photos/seed/HTL001b/800/500",
            "https://picsum.photos/seed/HTL001c/800/500",
        ],
        "description": (
            "A landmark of colonial grandeur, The Imperial stands at the heart of "
            "New Delhi, offering exquisite Art Deco interiors, world-class dining, "
            "and impeccable service that has welcomed royalty and heads of state."
        ),
        "available_rooms": 12,
        "room_types": [
            {"type": "Deluxe Room", "price": 18500, "capacity": 2},
            {"type": "Premier Room", "price": 24000, "capacity": 2},
            {"type": "Suite", "price": 45000, "capacity": 3},
            {"type": "Imperial Suite", "price": 85000, "capacity": 4},
        ],
        "coordinates": {"lat": 28.6222, "lng": 77.2219},
    },
    {
        "id": "HTL002",
        "name": "Leela Palace New Delhi",
        "city": "Delhi",
        "location": "Chanakyapuri, New Delhi",
        "address": "Africa Avenue, Chanakyapuri, New Delhi – 110023",
        "star_rating": 5,
        "price_per_night": 22000,
        "amenities": ["WiFi", "Rooftop Pool", "Spa", "Gym", "Multiple Restaurants",
                      "Butler Service", "Valet Parking", "Helipad", "Business Centre"],
        "images": [
            "https://picsum.photos/seed/HTL002a/800/500",
            "https://picsum.photos/seed/HTL002b/800/500",
        ],
        "description": (
            "An ultra-luxury retreat in the diplomatic enclave, Leela Palace blends "
            "Mughal architecture with contemporary opulence, featuring a rooftop pool "
            "overlooking the Delhi skyline."
        ),
        "available_rooms": 8,
        "room_types": [
            {"type": "Grand Deluxe Room", "price": 22000, "capacity": 2},
            {"type": "Royal Suite", "price": 55000, "capacity": 3},
            {"type": "Presidential Suite", "price": 120000, "capacity": 4},
        ],
        "coordinates": {"lat": 28.5921, "lng": 77.1893},
    },
    {
        "id": "HTL003",
        "name": "Ibis New Delhi Aerocity",
        "city": "Delhi",
        "location": "Aerocity, IGI Airport, New Delhi",
        "address": "Asset Area 7, Hospitality District, Aerocity, New Delhi – 110037",
        "star_rating": 3,
        "price_per_night": 3800,
        "amenities": ["WiFi", "Restaurant", "Bar", "Gym", "Airport Shuttle",
                      "24-hr Front Desk", "Laundry"],
        "images": [
            "https://picsum.photos/seed/HTL003a/800/500",
            "https://picsum.photos/seed/HTL003b/800/500",
        ],
        "description": (
            "Modern, affordable comfort steps from Indira Gandhi International Airport. "
            "Perfect for transit stays or quick business trips to the capital."
        ),
        "available_rooms": 35,
        "room_types": [
            {"type": "Standard Room", "price": 3800, "capacity": 2},
            {"type": "Superior Room", "price": 4800, "capacity": 2},
        ],
        "coordinates": {"lat": 28.5562, "lng": 77.0928},
    },

    # ── Mumbai ─────────────────────────────────────────────────────────────
    {
        "id": "HTL004",
        "name": "The Taj Mahal Palace Mumbai",
        "city": "Mumbai",
        "location": "Colaba, Mumbai",
        "address": "Apollo Bunder, Colaba, Mumbai – 400001",
        "star_rating": 5,
        "price_per_night": 28000,
        "amenities": ["WiFi", "Sea-View Pool", "Spa", "Gym", "6 Restaurants",
                      "Butler Service", "Valet Parking", "Heritage Tour",
                      "Business Centre", "Cigar Lounge"],
        "images": [
            "https://picsum.photos/seed/HTL004a/800/500",
            "https://picsum.photos/seed/HTL004b/800/500",
            "https://picsum.photos/seed/HTL004c/800/500",
        ],
        "description": (
            "The iconic Taj Mahal Palace, overlooking the Gateway of India and the "
            "Arabian Sea, is India's most storied hotel. A century of heritage meets "
            "flawless contemporary luxury."
        ),
        "available_rooms": 6,
        "room_types": [
            {"type": "Luxury Room", "price": 28000, "capacity": 2},
            {"type": "Luxury Suite", "price": 65000, "capacity": 3},
            {"type": "Grand Presidential Suite", "price": 200000, "capacity": 4},
        ],
        "coordinates": {"lat": 18.9217, "lng": 72.8332},
    },
    {
        "id": "HTL005",
        "name": "Trident Nariman Point",
        "city": "Mumbai",
        "location": "Nariman Point, Mumbai",
        "address": "Nariman Point, Mumbai – 400021",
        "star_rating": 5,
        "price_per_night": 16500,
        "amenities": ["WiFi", "Infinity Pool", "Spa", "Gym", "Fine Dining",
                      "Business Centre", "Concierge", "24-hr Room Service"],
        "images": [
            "https://picsum.photos/seed/HTL005a/800/500",
            "https://picsum.photos/seed/HTL005b/800/500",
        ],
        "description": (
            "Contemporary elegance at India's financial hub. The Trident Nariman Point "
            "offers breathtaking Marine Drive sea views and seamless business facilities."
        ),
        "available_rooms": 14,
        "room_types": [
            {"type": "Superior Room", "price": 16500, "capacity": 2},
            {"type": "Deluxe Sea-View Room", "price": 22000, "capacity": 2},
            {"type": "Club Suite", "price": 40000, "capacity": 3},
        ],
        "coordinates": {"lat": 18.9256, "lng": 72.8242},
    },
    {
        "id": "HTL006",
        "name": "Hotel Suba Palace Mumbai",
        "city": "Mumbai",
        "location": "Battery Street, Colaba, Mumbai",
        "address": "Battery Street, Apollo Bunder, Mumbai – 400039",
        "star_rating": 3,
        "price_per_night": 5500,
        "amenities": ["WiFi", "Restaurant", "Bar", "Parking", "Laundry", "24-hr Front Desk"],
        "images": [
            "https://picsum.photos/seed/HTL006a/800/500",
        ],
        "description": (
            "A well-loved mid-range hotel in the heart of Colaba, moments from the "
            "Gateway of India. Great value for money with warm, personalised service."
        ),
        "available_rooms": 20,
        "room_types": [
            {"type": "Standard Room", "price": 5500, "capacity": 2},
            {"type": "Deluxe Room", "price": 7000, "capacity": 3},
        ],
        "coordinates": {"lat": 18.9229, "lng": 72.8306},
    },

    # ── Jaipur ─────────────────────────────────────────────────────────────
    {
        "id": "HTL007",
        "name": "Rambagh Palace Jaipur",
        "city": "Jaipur",
        "location": "Bhawani Singh Road, Jaipur",
        "address": "Bhawani Singh Rd, Rambagh, Jaipur – 302005",
        "star_rating": 5,
        "price_per_night": 35000,
        "amenities": ["WiFi", "Heritage Pool", "Spa", "Polo Ground",
                      "Royal Dining", "Elephant Ride", "Valet Parking",
                      "Concierge", "Butler Service"],
        "images": [
            "https://picsum.photos/seed/HTL007a/800/500",
            "https://picsum.photos/seed/HTL007b/800/500",
            "https://picsum.photos/seed/HTL007c/800/500",
        ],
        "description": (
            "Once the residence of the Maharaja of Jaipur, Rambagh Palace is a "
            "magnificent showcase of Rajput architecture. Guests enjoy royal suites, "
            "manicured gardens, and unparalleled heritage experiences."
        ),
        "available_rooms": 5,
        "room_types": [
            {"type": "Grand Deluxe Room", "price": 35000, "capacity": 2},
            {"type": "Palace Suite", "price": 75000, "capacity": 3},
            {"type": "Royal Suite", "price": 150000, "capacity": 4},
        ],
        "coordinates": {"lat": 26.8890, "lng": 75.8069},
    },
    {
        "id": "HTL008",
        "name": "Hotel Pearl Palace Jaipur",
        "city": "Jaipur",
        "location": "Hari Kishan Somani Marg, Jaipur",
        "address": "51-52 Hari Kishan Somani Marg, Hathroi, Jaipur – 302001",
        "star_rating": 3,
        "price_per_night": 2800,
        "amenities": ["WiFi", "Rooftop Restaurant", "Parking",
                      "Travel Desk", "Laundry", "24-hr Front Desk"],
        "images": [
            "https://picsum.photos/seed/HTL008a/800/500",
            "https://picsum.photos/seed/HTL008b/800/500",
        ],
        "description": (
            "A charming boutique hotel with artistic Rajasthani décor. Famous for its "
            "award-winning rooftop restaurant with sweeping Pink City views."
        ),
        "available_rooms": 18,
        "room_types": [
            {"type": "Standard Room", "price": 2800, "capacity": 2},
            {"type": "Deluxe Room", "price": 3800, "capacity": 3},
        ],
        "coordinates": {"lat": 26.9124, "lng": 75.8065},
    },

    # ── Bangalore ──────────────────────────────────────────────────────────
    {
        "id": "HTL009",
        "name": "The Leela Palace Bengaluru",
        "city": "Bangalore",
        "location": "HAL Airport Road, Bengaluru",
        "address": "23 HAL Old Airport Rd, Kodihalli, Bengaluru – 560008",
        "star_rating": 5,
        "price_per_night": 19000,
        "amenities": ["WiFi", "Pool", "Spa", "Gym", "Fine Dining",
                      "Business Centre", "Concierge", "Valet Parking",
                      "24-hr Room Service", "Kids Club"],
        "images": [
            "https://picsum.photos/seed/HTL009a/800/500",
            "https://picsum.photos/seed/HTL009b/800/500",
        ],
        "description": (
            "The Leela Palace Bengaluru is a premier urban resort combining South "
            "Indian architecture with cutting-edge technology — ideal for both leisure "
            "and corporate travellers."
        ),
        "available_rooms": 16,
        "room_types": [
            {"type": "Deluxe Room", "price": 19000, "capacity": 2},
            {"type": "Premier Room", "price": 25000, "capacity": 2},
            {"type": "Club Suite", "price": 48000, "capacity": 3},
        ],
        "coordinates": {"lat": 12.9591, "lng": 77.6490},
    },
    {
        "id": "HTL010",
        "name": "Treebo Trend Maple Suites Bangalore",
        "city": "Bangalore",
        "location": "Indiranagar, Bengaluru",
        "address": "100 Feet Road, Indiranagar, Bengaluru – 560038",
        "star_rating": 3,
        "price_per_night": 4200,
        "amenities": ["WiFi", "Restaurant", "Parking", "Laundry",
                      "Air Conditioning", "24-hr Front Desk"],
        "images": [
            "https://picsum.photos/seed/HTL010a/800/500",
        ],
        "description": (
            "Comfortable, modern rooms in the vibrant Indiranagar neighbourhood, "
            "surrounded by Bengaluru's best cafés, restaurants, and pubs."
        ),
        "available_rooms": 25,
        "room_types": [
            {"type": "Standard Room", "price": 4200, "capacity": 2},
            {"type": "Superior Room", "price": 5500, "capacity": 2},
        ],
        "coordinates": {"lat": 12.9716, "lng": 77.6413},
    },

    # ── Goa ────────────────────────────────────────────────────────────────
    {
        "id": "HTL011",
        "name": "Taj Exotica Resort & Spa Goa",
        "city": "Goa",
        "location": "Benaulim Beach, South Goa",
        "address": "Calvaddo, Benaulim Beach, South Goa – 403716",
        "star_rating": 5,
        "price_per_night": 25000,
        "amenities": ["WiFi", "Private Beach", "4 Pools", "Spa",
                      "Water Sports", "Fine Dining", "Bar", "Kids Club",
                      "Valet Parking", "Yoga Classes"],
        "images": [
            "https://picsum.photos/seed/HTL011a/800/500",
            "https://picsum.photos/seed/HTL011b/800/500",
            "https://picsum.photos/seed/HTL011c/800/500",
        ],
        "description": (
            "A 56-acre slice of paradise on Benaulim Beach. Taj Exotica combines "
            "Portuguese heritage, lush tropical gardens, and world-class amenities "
            "for an unforgettable Goa escape."
        ),
        "available_rooms": 10,
        "room_types": [
            {"type": "Deluxe Room", "price": 25000, "capacity": 2},
            {"type": "Pool Villa", "price": 58000, "capacity": 2},
            {"type": "Beach Villa", "price": 80000, "capacity": 4},
        ],
        "coordinates": {"lat": 15.2593, "lng": 73.9316},
    },
    {
        "id": "HTL012",
        "name": "Zostel Goa (Panaji)",
        "city": "Goa",
        "location": "Fontainhas, Panaji, Goa",
        "address": "31/1 January 6th Lane, Fontainhas, Panaji, Goa – 403001",
        "star_rating": 2,
        "price_per_night": 950,
        "amenities": ["WiFi", "Common Kitchen", "Chill-Out Area",
                      "Lockers", "Bicycle Rental", "Travel Desk"],
        "images": [
            "https://picsum.photos/seed/HTL012a/800/500",
        ],
        "description": (
            "Goa's coolest backpacker hostel in the colourful Latin Quarter of "
            "Fontainhas. Perfect for solo travellers and budget-conscious explorers."
        ),
        "available_rooms": 40,
        "room_types": [
            {"type": "Dormitory Bed", "price": 950, "capacity": 1},
            {"type": "Private Room", "price": 2800, "capacity": 2},
        ],
        "coordinates": {"lat": 15.4989, "lng": 73.8278},
    },

    # ── Agra ───────────────────────────────────────────────────────────────
    {
        "id": "HTL013",
        "name": "ITC Mughal Agra",
        "city": "Agra",
        "location": "Fatehabad Road, Agra",
        "address": "Fatehabad Road, Tajganj, Agra – 282001",
        "star_rating": 5,
        "price_per_night": 21000,
        "amenities": ["WiFi", "Pool", "Spa", "Taj-View Rooms",
                      "Mughal Gardens", "Fine Dining", "Gym",
                      "Cooking Classes", "Concierge"],
        "images": [
            "https://picsum.photos/seed/HTL013a/800/500",
            "https://picsum.photos/seed/HTL013b/800/500",
        ],
        "description": (
            "Inspired by Mughal architecture, ITC Mughal is spread across 35 acres "
            "of lush gardens, minutes from the Taj Mahal. A magnificent tribute to "
            "the grandeur of the Mughal empire."
        ),
        "available_rooms": 11,
        "room_types": [
            {"type": "Deluxe Room", "price": 21000, "capacity": 2},
            {"type": "Mughal Suite", "price": 50000, "capacity": 3},
        ],
        "coordinates": {"lat": 27.1527, "lng": 78.0401},
    },

    # ── Chennai ────────────────────────────────────────────────────────────
    {
        "id": "HTL014",
        "name": "The Taj Coromandel Chennai",
        "city": "Chennai",
        "location": "Nungambakkam, Chennai",
        "address": "37 Mahatma Gandhi Rd, Nungambakkam, Chennai – 600034",
        "star_rating": 5,
        "price_per_night": 17500,
        "amenities": ["WiFi", "Pool", "Spa", "Gym", "Multiple Restaurants",
                      "Business Centre", "Concierge", "Valet Parking"],
        "images": [
            "https://picsum.photos/seed/HTL014a/800/500",
            "https://picsum.photos/seed/HTL014b/800/500",
        ],
        "description": (
            "Chennai's premier address for luxury travel. The Taj Coromandel delivers "
            "South Indian warmth paired with contemporary sophistication in the "
            "city's upscale Nungambakkam neighbourhood."
        ),
        "available_rooms": 13,
        "room_types": [
            {"type": "Superior Room", "price": 17500, "capacity": 2},
            {"type": "Deluxe Room", "price": 22000, "capacity": 2},
            {"type": "Suite", "price": 48000, "capacity": 3},
        ],
        "coordinates": {"lat": 13.0574, "lng": 80.2510},
    },

    # ── Hyderabad ──────────────────────────────────────────────────────────
    {
        "id": "HTL015",
        "name": "Taj Falaknuma Palace Hyderabad",
        "city": "Hyderabad",
        "location": "Engine Bowli, Falaknuma, Hyderabad",
        "address": "Engine Bowli, Falaknuma, Hyderabad – 500053",
        "star_rating": 5,
        "price_per_night": 42000,
        "amenities": ["WiFi", "Pool", "Spa", "Royal Banquet", "Horse Carriage",
                      "Heritage Tour", "Butler Service", "Telescope Terrace",
                      "Fine Dining", "Library"],
        "images": [
            "https://picsum.photos/seed/HTL015a/800/500",
            "https://picsum.photos/seed/HTL015b/800/500",
            "https://picsum.photos/seed/HTL015c/800/500",
        ],
        "description": (
            "Perched 2,000 feet above Hyderabad, the Falaknuma Palace was built by "
            "the sixth Nizam and is now a Taj hotel. Guests arrive by horse carriage "
            "and experience unparalleled Nizami grandeur."
        ),
        "available_rooms": 4,
        "room_types": [
            {"type": "Deluxe Room", "price": 42000, "capacity": 2},
            {"type": "Nizam Suite", "price": 100000, "capacity": 3},
            {"type": "Falaknuma Suite", "price": 200000, "capacity": 4},
        ],
        "coordinates": {"lat": 17.3227, "lng": 78.4650},
    },
    {
        "id": "HTL016",
        "name": "Golkonda Hotel Hyderabad",
        "city": "Hyderabad",
        "location": "Masab Tank, Hyderabad",
        "address": "10-1-124 Masab Tank, Hyderabad – 500028",
        "star_rating": 4,
        "price_per_night": 8500,
        "amenities": ["WiFi", "Pool", "Gym", "Restaurant", "Bar",
                      "Banquet Halls", "Travel Desk", "Parking"],
        "images": [
            "https://picsum.photos/seed/HTL016a/800/500",
        ],
        "description": (
            "A reliable 4-star retreat in central Hyderabad offering comfortable "
            "rooms, a sparkling pool, and easy access to both old and new city "
            "attractions."
        ),
        "available_rooms": 22,
        "room_types": [
            {"type": "Deluxe Room", "price": 8500, "capacity": 2},
            {"type": "Suite", "price": 16000, "capacity": 3},
        ],
        "coordinates": {"lat": 17.4022, "lng": 78.4602},
    },
    {
        "id": "HTL017",
        "name": "FabHotel Prime Corporate Hub Hyderabad",
        "city": "Hyderabad",
        "location": "Hitech City, Madhapur, Hyderabad",
        "address": "Plot 86, Kavuri Hills, Madhapur, Hyderabad – 500033",
        "star_rating": 2,
        "price_per_night": 2200,
        "amenities": ["WiFi", "Restaurant", "Air Conditioning", "Parking",
                      "24-hr Front Desk"],
        "images": [
            "https://picsum.photos/seed/HTL017a/800/500",
        ],
        "description": (
            "Budget-friendly business hotel in the heart of Hyderabad's IT corridor. "
            "Clean rooms, fast WiFi, and quick access to HITEC City offices."
        ),
        "available_rooms": 30,
        "room_types": [
            {"type": "Standard Room", "price": 2200, "capacity": 2},
        ],
        "coordinates": {"lat": 17.4400, "lng": 78.3789},
    },
    {
        "id": "HTL018",
        "name": "Zostel Jaipur",
        "city": "Jaipur",
        "location": "Bani Park, Jaipur",
        "address": "D-168 Shiv Marg, Bani Park, Jaipur – 302016",
        "star_rating": 2,
        "price_per_night": 850,
        "amenities": ["WiFi", "Common Kitchen", "Chill-Out Area",
                      "Rooftop", "Travel Desk", "Bicycle Rental"],
        "images": [
            "https://picsum.photos/seed/HTL018a/800/500",
        ],
        "description": (
            "Jaipur's favourite backpacker hostel in the peaceful Bani Park area. "
            "Colourful, safe, and social — with easy access to the walled city."
        ),
        "available_rooms": 35,
        "room_types": [
            {"type": "Dormitory Bed", "price": 850, "capacity": 1},
            {"type": "Private Room", "price": 2200, "capacity": 2},
        ],
        "coordinates": {"lat": 26.9300, "lng": 75.7970},
    },
]

# Quick lookup by id
_HOTEL_INDEX: dict[str, dict] = {h["id"]: h for h in HOTELS}


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------

def search_hotels(
    city: str,
    checkin: str = None,
    checkout: str = None,
    guests: int = 1,
    max_price: Optional[float] = None,
    min_stars: Optional[int] = None,
) -> list[dict]:
    """
    Return hotels matching the given criteria.

    Parameters
    ----------
    city       : Destination city (case-insensitive partial match)
    checkin    : Check-in date string (YYYY-MM-DD) — not used for mock filtering
    checkout   : Check-out date string (YYYY-MM-DD) — not used for mock filtering
    guests     : Number of guests (filters out hotels with no capable room type)
    max_price  : Maximum price per night (INR)
    min_stars  : Minimum star rating (1-5)
    """
    results = []
    city_lower = city.lower().strip() if city else ""

    for hotel in HOTELS:
        # City filter
        if city_lower and city_lower not in hotel["city"].lower():
            continue

        # Star rating filter
        if min_stars and hotel["star_rating"] < min_stars:
            continue

        # Price filter (use cheapest room type for comparison)
        cheapest = min(rt["price"] for rt in hotel["room_types"])
        if max_price and cheapest > max_price:
            continue

        # Guest capacity filter — at least one room type must accommodate guests
        can_accommodate = any(
            rt["capacity"] >= guests for rt in hotel["room_types"]
        )
        if not can_accommodate:
            continue

        # Only return available hotels
        if hotel["available_rooms"] <= 0:
            continue

        results.append(hotel)

    # Sort by star_rating descending, then by price ascending
    results.sort(key=lambda h: (-h["star_rating"], h["price_per_night"]))
    return results


def get_hotel_by_id(hotel_id: str) -> dict | None:
    """Return a single hotel by its ID, or None if not found."""
    return _HOTEL_INDEX.get(hotel_id)


def check_availability(
    hotel_id: str,
    checkin: str,
    checkout: str,
    room_type: str,
    guests: int,
) -> dict:
    """
    Check room availability for a hotel.

    Returns a dict with keys: available (bool), message, price_per_night,
    matching_room (dict | None).
    """
    hotel = get_hotel_by_id(hotel_id)
    if not hotel:
        return {"available": False, "message": "Hotel not found."}

    if hotel["available_rooms"] <= 0:
        return {
            "available": False,
            "message": f"Sorry, {hotel['name']} is fully booked.",
        }

    # Find matching room type
    matching_room = None
    for rt in hotel["room_types"]:
        if rt["type"].lower() == room_type.lower() and rt["capacity"] >= guests:
            matching_room = rt
            break

    # If no exact match, try any room that fits the guest count
    if not matching_room:
        for rt in hotel["room_types"]:
            if rt["capacity"] >= guests:
                matching_room = rt
                break

    if not matching_room:
        return {
            "available": False,
            "message": (
                f"No suitable room for {guests} guests found at {hotel['name']}."
            ),
        }

    return {
        "available": True,
        "message": f"{matching_room['type']} is available at {hotel['name']}.",
        "price_per_night": matching_room["price"],
        "matching_room": matching_room,
        "hotel": hotel,
    }


def get_popular_hotels(city: str = None, limit: int = 6) -> list[dict]:
    """
    Return the most popular hotels (highest star rating, then lowest price).
    Optionally filter by city.
    """
    pool = HOTELS if not city else [
        h for h in HOTELS if city.lower() in h["city"].lower()
    ]
    sorted_hotels = sorted(pool, key=lambda h: (-h["star_rating"], h["price_per_night"]))
    return sorted_hotels[:limit]
