from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from enum import Enum
import os

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class PropertyType(str, Enum):
    PROPERTY = "property"
    STATION = "station"
    UTILITY = "utility"

class PropertyColor(str, Enum):
    BROWN = "brown"
    LIGHT_BLUE = "light_blue"
    PINK = "pink"
    ORANGE = "orange"
    RED = "red"
    YELLOW = "yellow"
    GREEN = "green"
    DARK_BLUE = "dark_blue"
    STATION = "station"
    UTILITY = "utility"

PROPERTIES_DATA = {
    "old_kent_road": {
        "name": "Old Kent Road",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.BROWN,
        "purchase_cost": 60,
        "mortgage_value": 30,
        "house_cost": 50,
        "rent": {"0": 2, "1": 10, "2": 30, "3": 90, "4": 160, "hotel": 250}
    },
    "whitechapel_road": {
        "name": "Whitechapel Road",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.BROWN,
        "purchase_cost": 60,
        "mortgage_value": 30,
        "house_cost": 50,
        "rent": {"0": 4, "1": 20, "2": 60, "3": 180, "4": 320, "hotel": 450}
    },
    "angel_islington": {
        "name": "The Angel Islington",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.LIGHT_BLUE,
        "purchase_cost": 100,
        "mortgage_value": 50,
        "house_cost": 50,
        "rent": {"0": 6, "1": 30, "2": 90, "3": 270, "4": 400, "hotel": 550}
    },
    "euston_road": {
        "name": "Euston Road",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.LIGHT_BLUE,
        "purchase_cost": 100,
        "mortgage_value": 50,
        "house_cost": 50,
        "rent": {"0": 6, "1": 30, "2": 90, "3": 270, "4": 400, "hotel": 550}
    },
    "pentonville_road": {
        "name": "Pentonville Road",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.LIGHT_BLUE,
        "purchase_cost": 120,
        "mortgage_value": 60,
        "house_cost": 50,
        "rent": {"0": 8, "1": 40, "2": 100, "3": 300, "4": 450, "hotel": 600}
    },
    "pall_mall": {
        "name": "Pall Mall",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.PINK,
        "purchase_cost": 140,
        "mortgage_value": 70,
        "house_cost": 100,
        "rent": {"0": 10, "1": 50, "2": 150, "3": 450, "4": 625, "hotel": 750}
    },
    "whitehall": {
        "name": "Whitehall",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.PINK,
        "purchase_cost": 140,
        "mortgage_value": 70,
        "house_cost": 100,
        "rent": {"0": 10, "1": 50, "2": 150, "3": 450, "4": 625, "hotel": 750}
    },
    "northumberland_avenue": {
        "name": "Northumberland Avenue",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.PINK,
        "purchase_cost": 160,
        "mortgage_value": 80,
        "house_cost": 100,
        "rent": {"0": 12, "1": 60, "2": 180, "3": 500, "4": 700, "hotel": 900}
    },
    "bow_street": {
        "name": "Bow Street",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.ORANGE,
        "purchase_cost": 180,
        "mortgage_value": 90,
        "house_cost": 100,
        "rent": {"0": 14, "1": 70, "2": 200, "3": 550, "4": 750, "hotel": 950}
    },
    "marlborough_street": {
        "name": "Marlborough Street",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.ORANGE,
        "purchase_cost": 180,
        "mortgage_value": 90,
        "house_cost": 100,
        "rent": {"0": 14, "1": 70, "2": 200, "3": 550, "4": 750, "hotel": 950}
    },
    "vine_street": {
        "name": "Vine Street",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.ORANGE,
        "purchase_cost": 200,
        "mortgage_value": 100,
        "house_cost": 100,
        "rent": {"0": 16, "1": 80, "2": 220, "3": 600, "4": 800, "hotel": 1000}
    },
    "strand": {
        "name": "Strand",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.RED,
        "purchase_cost": 220,
        "mortgage_value": 110,
        "house_cost": 150,
        "rent": {"0": 18, "1": 90, "2": 250, "3": 700, "4": 875, "hotel": 1050}
    },
    "fleet_street": {
        "name": "Fleet Street",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.RED,
        "purchase_cost": 220,
        "mortgage_value": 110,
        "house_cost": 150,
        "rent": {"0": 18, "1": 90, "2": 250, "3": 700, "4": 875, "hotel": 1050}
    },
    "trafalgar_square": {
        "name": "Trafalgar Square",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.RED,
        "purchase_cost": 240,
        "mortgage_value": 120,
        "house_cost": 150,
        "rent": {"0": 20, "1": 100, "2": 300, "3": 750, "4": 925, "hotel": 1100}
    },
    "leicester_square": {
        "name": "Leicester Square",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.YELLOW,
        "purchase_cost": 260,
        "mortgage_value": 130,
        "house_cost": 150,
        "rent": {"0": 22, "1": 110, "2": 330, "3": 800, "4": 975, "hotel": 1150}
    },
    "coventry_street": {
        "name": "Coventry Street",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.YELLOW,
        "purchase_cost": 260,
        "mortgage_value": 130,
        "house_cost": 150,
        "rent": {"0": 22, "1": 110, "2": 330, "3": 800, "4": 975, "hotel": 1150}
    },
    "piccadilly": {
        "name": "Piccadilly",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.YELLOW,
        "purchase_cost": 280,
        "mortgage_value": 140,
        "house_cost": 150,
        "rent": {"0": 24, "1": 120, "2": 360, "3": 850, "4": 1025, "hotel": 1200}
    },
    "regent_street": {
        "name": "Regent Street",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.GREEN,
        "purchase_cost": 300,
        "mortgage_value": 150,
        "house_cost": 200,
        "rent": {"0": 26, "1": 130, "2": 390, "3": 900, "4": 1100, "hotel": 1275}
    },
    "oxford_street": {
        "name": "Oxford Street",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.GREEN,
        "purchase_cost": 300,
        "mortgage_value": 150,
        "house_cost": 200,
        "rent": {"0": 26, "1": 130, "2": 390, "3": 900, "4": 1100, "hotel": 1275}
    },
    "bond_street": {
        "name": "Bond Street",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.GREEN,
        "purchase_cost": 320,
        "mortgage_value": 160,
        "house_cost": 200,
        "rent": {"0": 28, "1": 150, "2": 450, "3": 1000, "4": 1200, "hotel": 1400}
    },
    "park_lane": {
        "name": "Park Lane",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.DARK_BLUE,
        "purchase_cost": 350,
        "mortgage_value": 175,
        "house_cost": 200,
        "rent": {"0": 35, "1": 175, "2": 500, "3": 1100, "4": 1300, "hotel": 1500}
    },
    "mayfair": {
        "name": "Mayfair",
        "type": PropertyType.PROPERTY,
        "color": PropertyColor.DARK_BLUE,
        "purchase_cost": 400,
        "mortgage_value": 200,
        "house_cost": 200,
        "rent": {"0": 50, "1": 200, "2": 600, "3": 1400, "4": 1700, "hotel": 2000}
    },
    "kings_cross_station": {
        "name": "King's Cross Station",
        "type": PropertyType.STATION,
        "color": PropertyColor.STATION,
        "purchase_cost": 200,
        "mortgage_value": 100
    },
    "marylebone_station": {
        "name": "Marylebone Station",
        "type": PropertyType.STATION,
        "color": PropertyColor.STATION,
        "purchase_cost": 200,
        "mortgage_value": 100
    },
    "fenchurch_street_station": {
        "name": "Fenchurch Street Station",
        "type": PropertyType.STATION,
        "color": PropertyColor.STATION,
        "purchase_cost": 200,
        "mortgage_value": 100
    },
    "liverpool_street_station": {
        "name": "Liverpool Street Station",
        "type": PropertyType.STATION,
        "color": PropertyColor.STATION,
        "purchase_cost": 200,
        "mortgage_value": 100
    },
    "electric_company": {
        "name": "Electric Company",
        "type": PropertyType.UTILITY,
        "color": PropertyColor.UTILITY,
        "purchase_cost": 150,
        "mortgage_value": 75
    },
    "water_works": {
        "name": "Water Works",
        "type": PropertyType.UTILITY,
        "color": PropertyColor.UTILITY,
        "purchase_cost": 150,
        "mortgage_value": 75
    }
}

STATION_RENT = {1: 25, 2: 50, 3: 100, 4: 200}

COLOR_GROUPS = {
    PropertyColor.BROWN: ["old_kent_road", "whitechapel_road"],
    PropertyColor.LIGHT_BLUE: ["angel_islington", "euston_road", "pentonville_road"],
    PropertyColor.PINK: ["pall_mall", "whitehall", "northumberland_avenue"],
    PropertyColor.ORANGE: ["bow_street", "marlborough_street", "vine_street"],
    PropertyColor.RED: ["strand", "fleet_street", "trafalgar_square"],
    PropertyColor.YELLOW: ["leicester_square", "coventry_street", "piccadilly"],
    PropertyColor.GREEN: ["regent_street", "oxford_street", "bond_street"],
    PropertyColor.DARK_BLUE: ["park_lane", "mayfair"],
}

class Player(BaseModel):
    id: int
    name: str
    cash: int = 1500
    properties: dict = {}

class OwnedProperty(BaseModel):
    property_id: str
    houses: int = 0
    has_hotel: bool = False
    is_mortgaged: bool = False

class GameState:
    def __init__(self):
        self.players: dict[int, Player] = {}
        self.owned_properties: dict[str, OwnedProperty] = {}
        self.property_owners: dict[str, int] = {}
        self.free_parking_pot: int = 0
        self.next_player_id: int = 1

game_state = GameState()

class CreatePlayerRequest(BaseModel):
    name: str

class TransferMoneyRequest(BaseModel):
    from_player_id: Optional[int] = None
    to_player_id: Optional[int] = None
    amount: int
    is_fine: bool = False

class BuyPropertyRequest(BaseModel):
    player_id: int
    property_id: str

class MortgageRequest(BaseModel):
    player_id: int
    property_id: str

class BuildHouseRequest(BaseModel):
    player_id: int
    property_id: str

class PayRentRequest(BaseModel):
    from_player_id: int
    property_id: str
    dice_roll: Optional[int] = None

class CollectFreeParkingRequest(BaseModel):
    player_id: int

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/game/state")
async def get_game_state():
    players_list = []
    for player in game_state.players.values():
        player_properties = []
        for prop_id, owner_id in game_state.property_owners.items():
            if owner_id == player.id:
                owned_prop = game_state.owned_properties.get(prop_id)
                prop_data = PROPERTIES_DATA[prop_id].copy()
                prop_data["property_id"] = prop_id
                if owned_prop:
                    prop_data["houses"] = owned_prop.houses
                    prop_data["has_hotel"] = owned_prop.has_hotel
                    prop_data["is_mortgaged"] = owned_prop.is_mortgaged
                player_properties.append(prop_data)
        players_list.append({
            "id": player.id,
            "name": player.name,
            "cash": player.cash,
            "properties": player_properties
        })
    
    return {
        "players": players_list,
        "free_parking_pot": game_state.free_parking_pot,
        "available_properties": [
            {**PROPERTIES_DATA[prop_id], "property_id": prop_id}
            for prop_id in PROPERTIES_DATA
            if prop_id not in game_state.property_owners
        ]
    }

@app.get("/properties")
async def get_all_properties():
    return {
        "properties": [
            {**data, "property_id": prop_id}
            for prop_id, data in PROPERTIES_DATA.items()
        ]
    }

@app.post("/players")
async def create_player(request: CreatePlayerRequest):
    if len(game_state.players) >= 8:
        raise HTTPException(status_code=400, detail="Maximum 8 players allowed")
    
    player = Player(
        id=game_state.next_player_id,
        name=request.name
    )
    game_state.players[player.id] = player
    game_state.next_player_id += 1
    
    return {"player": {"id": player.id, "name": player.name, "cash": player.cash}}

@app.delete("/players/{player_id}")
async def remove_player(player_id: int):
    if player_id not in game_state.players:
        raise HTTPException(status_code=404, detail="Player not found")
    
    props_to_remove = [prop_id for prop_id, owner_id in game_state.property_owners.items() if owner_id == player_id]
    for prop_id in props_to_remove:
        del game_state.property_owners[prop_id]
        if prop_id in game_state.owned_properties:
            del game_state.owned_properties[prop_id]
    
    del game_state.players[player_id]
    return {"message": "Player removed"}

@app.post("/transfer")
async def transfer_money(request: TransferMoneyRequest):
    if request.from_player_id is not None and request.from_player_id not in game_state.players:
        raise HTTPException(status_code=404, detail="From player not found")
    if request.to_player_id is not None and request.to_player_id not in game_state.players:
        raise HTTPException(status_code=404, detail="To player not found")
    
    if request.from_player_id is not None:
        player = game_state.players[request.from_player_id]
        if player.cash < request.amount:
            raise HTTPException(status_code=400, detail="Insufficient funds")
        player.cash -= request.amount
    
    if request.to_player_id is not None:
        game_state.players[request.to_player_id].cash += request.amount
    elif request.is_fine:
        game_state.free_parking_pot += request.amount
    
    return {"message": "Transfer complete", "free_parking_pot": game_state.free_parking_pot}

@app.post("/properties/buy")
async def buy_property(request: BuyPropertyRequest):
    if request.player_id not in game_state.players:
        raise HTTPException(status_code=404, detail="Player not found")
    if request.property_id not in PROPERTIES_DATA:
        raise HTTPException(status_code=404, detail="Property not found")
    if request.property_id in game_state.property_owners:
        raise HTTPException(status_code=400, detail="Property already owned")
    
    player = game_state.players[request.player_id]
    prop_data = PROPERTIES_DATA[request.property_id]
    
    if player.cash < prop_data["purchase_cost"]:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    
    player.cash -= prop_data["purchase_cost"]
    game_state.property_owners[request.property_id] = request.player_id
    game_state.owned_properties[request.property_id] = OwnedProperty(property_id=request.property_id)
    
    return {"message": f"Property {prop_data['name']} purchased", "player_cash": player.cash}

@app.post("/properties/mortgage")
async def mortgage_property(request: MortgageRequest):
    if request.player_id not in game_state.players:
        raise HTTPException(status_code=404, detail="Player not found")
    if request.property_id not in game_state.property_owners:
        raise HTTPException(status_code=404, detail="Property not owned")
    if game_state.property_owners[request.property_id] != request.player_id:
        raise HTTPException(status_code=400, detail="Player does not own this property")
    
    owned_prop = game_state.owned_properties[request.property_id]
    if owned_prop.is_mortgaged:
        raise HTTPException(status_code=400, detail="Property already mortgaged")
    if owned_prop.houses > 0 or owned_prop.has_hotel:
        raise HTTPException(status_code=400, detail="Must sell all houses/hotels before mortgaging")
    
    prop_data = PROPERTIES_DATA[request.property_id]
    player = game_state.players[request.player_id]
    
    owned_prop.is_mortgaged = True
    player.cash += prop_data["mortgage_value"]
    
    return {"message": f"Property {prop_data['name']} mortgaged", "player_cash": player.cash}

@app.post("/properties/unmortgage")
async def unmortgage_property(request: MortgageRequest):
    if request.player_id not in game_state.players:
        raise HTTPException(status_code=404, detail="Player not found")
    if request.property_id not in game_state.property_owners:
        raise HTTPException(status_code=404, detail="Property not owned")
    if game_state.property_owners[request.property_id] != request.player_id:
        raise HTTPException(status_code=400, detail="Player does not own this property")
    
    owned_prop = game_state.owned_properties[request.property_id]
    if not owned_prop.is_mortgaged:
        raise HTTPException(status_code=400, detail="Property is not mortgaged")
    
    prop_data = PROPERTIES_DATA[request.property_id]
    player = game_state.players[request.player_id]
    unmortgage_cost = int(prop_data["mortgage_value"] * 1.1)
    
    if player.cash < unmortgage_cost:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    
    owned_prop.is_mortgaged = False
    player.cash -= unmortgage_cost
    
    return {"message": f"Property {prop_data['name']} unmortgaged", "player_cash": player.cash, "cost": unmortgage_cost}

@app.post("/properties/build")
async def build_house(request: BuildHouseRequest):
    if request.player_id not in game_state.players:
        raise HTTPException(status_code=404, detail="Player not found")
    if request.property_id not in game_state.property_owners:
        raise HTTPException(status_code=404, detail="Property not owned")
    if game_state.property_owners[request.property_id] != request.player_id:
        raise HTTPException(status_code=400, detail="Player does not own this property")
    
    prop_data = PROPERTIES_DATA[request.property_id]
    if prop_data["type"] != PropertyType.PROPERTY:
        raise HTTPException(status_code=400, detail="Cannot build on stations or utilities")
    
    color = prop_data["color"]
    color_group = COLOR_GROUPS.get(color, [])
    for prop_id in color_group:
        if prop_id not in game_state.property_owners or game_state.property_owners[prop_id] != request.player_id:
            raise HTTPException(status_code=400, detail="Must own all properties in color group to build")
    
    owned_prop = game_state.owned_properties[request.property_id]
    if owned_prop.is_mortgaged:
        raise HTTPException(status_code=400, detail="Cannot build on mortgaged property")
    if owned_prop.has_hotel:
        raise HTTPException(status_code=400, detail="Property already has a hotel")
    
    player = game_state.players[request.player_id]
    house_cost = prop_data["house_cost"]
    
    if player.cash < house_cost:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    
    player.cash -= house_cost
    
    if owned_prop.houses == 4:
        owned_prop.houses = 0
        owned_prop.has_hotel = True
        return {"message": f"Hotel built on {prop_data['name']}", "player_cash": player.cash}
    else:
        owned_prop.houses += 1
        return {"message": f"House built on {prop_data['name']} (now {owned_prop.houses} houses)", "player_cash": player.cash}

@app.post("/properties/sell-building")
async def sell_building(request: BuildHouseRequest):
    if request.player_id not in game_state.players:
        raise HTTPException(status_code=404, detail="Player not found")
    if request.property_id not in game_state.property_owners:
        raise HTTPException(status_code=404, detail="Property not owned")
    if game_state.property_owners[request.property_id] != request.player_id:
        raise HTTPException(status_code=400, detail="Player does not own this property")
    
    prop_data = PROPERTIES_DATA[request.property_id]
    owned_prop = game_state.owned_properties[request.property_id]
    
    if not owned_prop.has_hotel and owned_prop.houses == 0:
        raise HTTPException(status_code=400, detail="No buildings to sell")
    
    player = game_state.players[request.player_id]
    sell_value = prop_data["house_cost"] // 2
    
    if owned_prop.has_hotel:
        owned_prop.has_hotel = False
        owned_prop.houses = 4
        player.cash += sell_value
        return {"message": f"Hotel sold on {prop_data['name']} (now 4 houses)", "player_cash": player.cash}
    else:
        owned_prop.houses -= 1
        player.cash += sell_value
        return {"message": f"House sold on {prop_data['name']} (now {owned_prop.houses} houses)", "player_cash": player.cash}

def calculate_rent(property_id: str, dice_roll: Optional[int] = None) -> int:
    prop_data = PROPERTIES_DATA[property_id]
    owner_id = game_state.property_owners.get(property_id)
    
    if owner_id is None:
        return 0
    
    owned_prop = game_state.owned_properties.get(property_id)
    if owned_prop and owned_prop.is_mortgaged:
        return 0
    
    if prop_data["type"] == PropertyType.STATION:
        stations_owned = sum(
            1 for pid in ["kings_cross_station", "marylebone_station", "fenchurch_street_station", "liverpool_street_station"]
            if game_state.property_owners.get(pid) == owner_id
        )
        return STATION_RENT.get(stations_owned, 0)
    
    elif prop_data["type"] == PropertyType.UTILITY:
        if dice_roll is None:
            raise ValueError("Dice roll required for utility rent")
        utilities_owned = sum(
            1 for pid in ["electric_company", "water_works"]
            if game_state.property_owners.get(pid) == owner_id
        )
        multiplier = 10 if utilities_owned == 2 else 4
        return dice_roll * multiplier
    
    else:
        if owned_prop.has_hotel:
            return prop_data["rent"]["hotel"]
        elif owned_prop.houses > 0:
            return prop_data["rent"][str(owned_prop.houses)]
        else:
            base_rent = prop_data["rent"]["0"]
            color = prop_data["color"]
            color_group = COLOR_GROUPS.get(color, [])
            owns_all = all(
                game_state.property_owners.get(pid) == owner_id
                for pid in color_group
            )
            return base_rent * 2 if owns_all else base_rent

@app.post("/rent/calculate")
async def calculate_rent_endpoint(request: PayRentRequest):
    if request.property_id not in PROPERTIES_DATA:
        raise HTTPException(status_code=404, detail="Property not found")
    if request.property_id not in game_state.property_owners:
        return {"rent": 0, "message": "Property not owned"}
    
    prop_data = PROPERTIES_DATA[request.property_id]
    
    try:
        rent = calculate_rent(request.property_id, request.dice_roll)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return {
        "rent": rent,
        "property_name": prop_data["name"],
        "owner_id": game_state.property_owners[request.property_id]
    }

@app.post("/rent/pay")
async def pay_rent(request: PayRentRequest):
    if request.from_player_id not in game_state.players:
        raise HTTPException(status_code=404, detail="Player not found")
    if request.property_id not in PROPERTIES_DATA:
        raise HTTPException(status_code=404, detail="Property not found")
    if request.property_id not in game_state.property_owners:
        return {"message": "Property not owned, no rent due"}
    
    owner_id = game_state.property_owners[request.property_id]
    if owner_id == request.from_player_id:
        return {"message": "Player owns this property, no rent due"}
    
    try:
        rent = calculate_rent(request.property_id, request.dice_roll)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    if rent == 0:
        return {"message": "No rent due (property mortgaged)"}
    
    payer = game_state.players[request.from_player_id]
    if payer.cash < rent:
        raise HTTPException(status_code=400, detail=f"Insufficient funds. Rent is £{rent}")
    
    payer.cash -= rent
    game_state.players[owner_id].cash += rent
    
    prop_data = PROPERTIES_DATA[request.property_id]
    return {
        "message": f"Rent of £{rent} paid for {prop_data['name']}",
        "rent": rent,
        "payer_cash": payer.cash,
        "owner_cash": game_state.players[owner_id].cash
    }

@app.post("/free-parking/collect")
async def collect_free_parking(request: CollectFreeParkingRequest):
    if request.player_id not in game_state.players:
        raise HTTPException(status_code=404, detail="Player not found")
    
    amount = game_state.free_parking_pot
    game_state.players[request.player_id].cash += amount
    game_state.free_parking_pot = 0
    
    return {
        "message": f"Collected £{amount} from Free Parking",
        "amount": amount,
        "player_cash": game_state.players[request.player_id].cash
    }

@app.post("/game/reset")
async def reset_game():
    game_state.players.clear()
    game_state.owned_properties.clear()
    game_state.property_owners.clear()
    game_state.free_parking_pot = 0
    game_state.next_player_id = 1
    return {"message": "Game reset"}

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")

@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")
