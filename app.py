from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import pytz
import math
import os
from geopy.geocoders import Nominatim
from skyfield.api import load, Topos

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "https://sarojjawa.in",
            "https://www.sarojjawa.in",
            "http://sarojjawa.in",
            "http://www.sarojjawa.in"
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"]
    }
})

# Load ephemeris once during startup
ts = load.timescale()
eph = load('de421.bsp')
earth = eph['earth']

# Vedic Signs (Rashis)
RASHIS = [
    {"id": 1, "name": "Mesh (Aries)", "lord": "Mars"},
    {"id": 2, "name": "Vrishabh (Taurus)", "lord": "Venus"},
    {"id": 3, "name": "Mithun (Gemini)", "lord": "Mercury"},
    {"id": 4, "name": "Kark (Cancer)", "lord": "Moon"},
    {"id": 5, "name": "Simha (Leo)", "lord": "Sun"},
    {"id": 6, "name": "Kanya (Virgo)", "lord": "Mercury"},
    {"id": 7, "name": "Tula (Libra)", "lord": "Venus"},
    {"id": 8, "name": "Vrishchik (Scorpio)", "lord": "Mars"},
    {"id": 9, "name": "Dhanu (Sagittarius)", "lord": "Jupiter"},
    {"id": 10, "name": "Makar (Capricorn)", "lord": "Saturn"},
    {"id": 11, "name": "Kumbh (Aquarius)", "lord": "Saturn"},
    {"id": 12, "name": "Meen (Pisces)", "lord": "Jupiter"}
]

PLANET_TRAITS = {
    1: {"planet": "Sun (Surya)", "nature": "Leadership, Pioneer, Confidence", "color": "Gold/Orange"},
    2: {"planet": "Moon (Chandra)", "nature": "Intuition, Harmony, Creativity", "color": "White/Silver"},
    3: {"planet": "Jupiter (Guru)", "nature": "Wisdom, Communication, Ambition", "color": "Yellow"},
    4: {"planet": "Rahu", "nature": "Strategy, Discipline, Unconventional", "color": "Grey/Blue"},
    5: {"planet": "Mercury (Budh)", "nature": "Business, Adaptability, Networking", "color": "Green"},
    6: {"planet": "Venus (Shukra)", "nature": "Luxury, Love, Artistic, Glamour", "color": "Light Blue/Pink"},
    7: {"planet": "Ketu", "nature": "Spirituality, Analysis, Research", "color": "White/Smoky"},
    8: {"planet": "Saturn (Shani)", "nature": "Hard work, Authority, Wealth Management", "color": "Dark Blue/Black"},
    9: {"planet": "Mars (Mangal)", "nature": "Energy, Courage, Humanitarian", "color": "Red/Coral"}
}

def reduce_number(n):
    while n > 9:
        n = sum(int(d) for d in str(n))
    return n

def get_lahiri_ayanamsha(year):
    return 23.85 + (year - 2000) * 0.01397

# --- 1. SERVE FRONTEND PAGES ---
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(path):
        return send_from_directory('.', path)
    return send_from_directory('.', 'index.html')

# --- 2. BACKEND API ROUTES ---
@app.route('/api/numerology/mulank', methods=['POST'])
def calculate_mulank():
    try:
        data = request.get_json() or {}
        dob_str = data.get('dob')
        if not dob_str:
            return jsonify({"status": "error", "message": "DOB is required (YYYY-MM-DD)"}), 400

        dt = datetime.strptime(dob_str, "%Y-%m-%d")
        mulank = reduce_number(dt.day)
        total_sum = sum(int(d) for d in dob_str if d.isdigit())
        bhagyank = reduce_number(total_sum)

        return jsonify({
            "status": "success",
            "data": {
                "mulank": mulank,
                "mulank_details": PLANET_TRAITS.get(mulank),
                "bhagyank": bhagyank,
                "bhagyank_details": PLANET_TRAITS.get(bhagyank)
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/astrology/kundli', methods=['POST'])
def generate_kundli():
    print(f"\n[DEBUG] --- Incoming Request ---")
    print(f"[DEBUG] Method: {request.method}")
    print(f"[DEBUG] Path: {request.path}")
    
    try:
        data = request.get_json() or {}
        print(f"[DEBUG] JSON Data: {data}")
        
        name = data.get('name', 'User')
        dob_str = data.get('dob')
        time_str = data.get('time', '12:00')
        place = data.get('place', 'Delhi, India')

        if not dob_str or not time_str or not place:
            print("[DEBUG] Validation failed: missing parameters")
            return jsonify({"status": "error", "message": "Name, DOB, Time and Place are required"}), 400

        geolocator = Nominatim(user_agent="saroj_jawa_astrology")
        print(f"[DEBUG] Fetching coordinates for place: {place}")
        loc = geolocator.geocode(place, timeout=10)
        lat = loc.latitude if loc else 28.6139
        lon = loc.longitude if loc else 77.2090
        print(f"[DEBUG] Coordinates: {lat}, {lon}")

        dt = datetime.strptime(f"{dob_str} {time_str}", "%Y-%m-%d %H:%M")
        utc_dt = dt - pytz.timezone('Asia/Kolkata').utcoffset(dt)
        t = ts.utc(utc_dt.year, utc_dt.month, utc_dt.day, utc_dt.hour, utc_dt.minute)
        
        observer = earth + Topos(latitude_degrees=lat, longitude_degrees=lon)
        ayanamsha = get_lahiri_ayanamsha(dt.year)

        planet_keys = {
            'Sun': eph['sun'],
            'Moon': eph['moon'],
            'Mars': eph['mars'],
            'Mercury': eph['mercury'],
            'Jupiter': eph['jupiter barycenter'],
            'Venus': eph['venus'],
            'Saturn': eph['saturn barycenter']
        }

        gst = t.gast
        lst = (gst + lon / 15.0) % 24.0
        ramc = lst * 15.0
        eps = math.radians(23.44)
        rad_lat = math.radians(lat)
        rad_ramc = math.radians(ramc)

        asc_rad = math.atan2(math.cos(rad_ramc), -math.sin(rad_ramc) * math.cos(eps) - math.tan(rad_lat) * math.sin(eps))
        asc_tropical = math.degrees(asc_rad) % 360.0
        asc_sidereal = (asc_tropical - ayanamsha) % 360.0

        asc_sign_index = int(asc_sidereal // 30)
        asc_sign = RASHIS[asc_sign_index]

        planets_data = []
        houses_grid = {i: [] for i in range(1, 13)}

        for p_name, p_obj in planet_keys.items():
            astrometric = observer.at(t).observe(p_obj)
            apparent = astrometric.apparent()
            lat_p, lon_p, distance = apparent.ecliptic_latlon()

            trop_lon = lon_p.degrees
            sid_lon = (trop_lon - ayanamsha) % 360.0
            sign_idx = int(sid_lon // 30)
            sign_info = RASHIS[sign_idx]

            house_no = ((sign_info["id"] - asc_sign["id"]) % 12) + 1

            planets_data.append({
                "name": p_name,
                "sign": sign_info["name"],
                "degree": round(sid_lon % 30, 2),
                "house": house_no
            })
            houses_grid[house_no].append(p_name[:2])

        return jsonify({
            "status": "success",
            "data": {
                "name": name,
                "birth_details": {"dob": dob_str, "time": time_str, "place": place},
                "lagna": {
                    "rashi": asc_sign["name"],
                    "rashi_no": asc_sign["id"],
                    "lord": asc_sign["lord"]
                },
                "planets": planets_data,
                "houses_grid": houses_grid
            }
        })
    except Exception as e:
        print(f"[DEBUG] ERROR in Kundli generation: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(host='0.0.0.0', port=port, debug=False)