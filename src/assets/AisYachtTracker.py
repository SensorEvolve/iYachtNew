import asyncio
import csv
import json
import os
import random
from datetime import datetime
from typing import Any, Dict, Optional

import websockets


class ConnectionManager:
    def __init__(self):
        self.max_retries = float("inf")
        self.base_delay = 1
        self.max_delay = 30
        self.jitter = 0.1
        self.current_retry = 0
        self.last_successful_connection = None

    async def delay_with_jitter(self):
        delay = min(
            self.max_delay,
            self.base_delay * (2 ** min(self.current_retry, 4))
            + random.uniform(0, self.jitter),
        )
        await asyncio.sleep(delay)
        return delay


class GlobalVesselTracker:
    def __init__(self):
        self.api_key = "a8437deb4bfa21aa490de22b93bee19dcbb76540"
        self.connection_mgr = ConnectionManager()
        csv_path = "/Users/ethereum/developer/nvimprojects/iYachtNew/src/assets/super_yachts.csv"
        print(f"\nAttempting to load vessels from: {csv_path}")
        self.tracked_vessels = self.load_vessels_from_csv(csv_path)
        self.vessels_status = {}
        self.is_running = True
        self.last_heartbeat = None
        self.heartbeat_interval = 30  # seconds
        self.message_counts = {mmsi: 0 for mmsi in self.tracked_vessels.keys()}
        self.last_status_print = datetime.now()
        self.status_print_interval = 60  # Print status every 60 seconds

    def load_vessels_from_csv(self, csv_path: str) -> Dict[str, str]:
        vessels = {}
        try:
            if not os.path.exists(csv_path):
                print(f"❌ Error: CSV file not found at {csv_path}")
                return {}

            with open(csv_path, "r") as file:
                reader = csv.DictReader(file, delimiter=";")
                print(f"CSV columns found: {reader.fieldnames}")

                for row in reader:
                    mmsi = row.get("MMSI")
                    name = row.get("Name")
                    if mmsi and mmsi.strip() != "" and mmsi.lower() != "none" and name:
                        vessels[str(mmsi)] = name
                        print(f"Added vessel: {name} (MMSI: {mmsi})")

            print(f"✅ Successfully loaded {len(vessels)} vessels from CSV")
            if len(vessels) == 0:
                print("⚠️  Warning: No vessels were loaded. Check CSV format.")
            return vessels

        except Exception as e:
            print(f"❌ Error loading CSV: {str(e)}")
            return {}

    async def subscribe(self, websocket):
        subscribe_message = {
            "APIKey": self.api_key,
            "BoundingBoxes": [[[-90, -180], [90, 180]]],  # Global coverage
            "FiltersShipMMSI": list(self.tracked_vessels.keys()),
            "FilterMessageTypes": ["PositionReport", "StandardClassBPositionReport"],
        }
        print("\n📡 Subscription details:")
        print(f"Tracking MMSIs: {', '.join(self.tracked_vessels.keys())}")
        await websocket.send(json.dumps(subscribe_message))

    async def print_tracking_status(self):
        now = datetime.now()
        if (now - self.last_status_print).seconds >= self.status_print_interval:
            print("\n=== 📊 Tracking Status Update ===")
            for mmsi, name in self.tracked_vessels.items():
                last_update = self.vessels_status.get(mmsi, {}).get(
                    "last_update", "No updates"
                )
                msg_count = self.message_counts[mmsi]
                print(f"🚢 {name} (MMSI: {mmsi})")
                print(f"   Messages received: {msg_count}")
                print(f"   Last update: {last_update}")
            print("================================\n")
            self.last_status_print = now

    async def process_message(self, data: Dict):
        try:
            msg_type = data.get("MessageType")
            if msg_type not in ["PositionReport", "StandardClassBPositionReport"]:
                return

            meta = data.get("MetaData", {})
            mmsi = str(meta.get("MMSI", ""))

            if mmsi in self.tracked_vessels:
                self.message_counts[mmsi] += 1

            if not mmsi or mmsi not in self.tracked_vessels:
                return

            position_data = data.get("Message", {}).get(msg_type, {})
            lat = position_data.get("Latitude")
            lon = position_data.get("Longitude")

            if not (lat and lon):
                return

            speed = position_data.get("Sog", "N/A")
            course = position_data.get("Cog", "N/A")
            status = position_data.get("NavigationalStatus", "N/A")
            timestamp = meta.get(
                "time_utc", datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
            )

            self.vessels_status[mmsi] = {
                "last_position": {"lat": lat, "lon": lon},
                "speed": speed,
                "course": course,
                "status": status,
                "last_update": timestamp,
            }

            status_desc = {
                0: "Under way using engine",
                1: "At anchor",
                2: "Not under command",
                3: "Restricted maneuverability",
                4: "Constrained by draught",
                5: "Moored",
                6: "Aground",
                7: "Engaged in fishing",
                8: "Under way sailing",
                15: "Undefined",
            }.get(status, "Unknown")

            print(
                f"""
╔═══════════════ VESSEL UPDATE ════════════════╗
║ 🚢 {self.tracked_vessels[mmsi]}
║ 🔍 MMSI: {mmsi}
║ 📍 Position: {lat:.4f}°N, {lon:.4f}°E
║ ⚡ Speed: {speed} knots
║ 🧭 Course: {course}°
║ 🚩 Status: {status_desc}
║ 📊 Updates received: {self.message_counts[mmsi]}
║ ⏰ {timestamp}
╚══════════════════════════════════════════════╝"""
            )

            await self.print_tracking_status()

        except Exception as e:
            print(f"⚠️  Error processing vessel data: {e}")

    async def start(self):
        print(
            f"""
🚢 Global Vessel Tracker
🌍 Tracking {len(self.tracked_vessels)} vessels worldwide
"""
        )

        while self.is_running:
            try:
                async with websockets.connect(
                    "wss://stream.aisstream.io/v0/stream",
                    ping_interval=20,
                    ping_timeout=20,
                    close_timeout=20,
                ) as websocket:

                    self.connection_mgr.current_retry = 0
                    heartbeat_task = asyncio.create_task(self.heartbeat(websocket))
                    await self.subscribe(websocket)
                    print("✅ Connection established, monitoring vessels globally...")

                    async for message in websocket:
                        try:
                            data = json.loads(message)
                            await self.process_message(data)
                        except json.JSONDecodeError:
                            continue
                        except Exception as e:
                            print(f"⚠️  Message processing error: {e}")
                            continue

            except websockets.exceptions.ConnectionClosed:
                print("\n🔌 Connection closed")
            except Exception as e:
                print(f"\n❌ Connection error: {e}")

            if self.is_running:
                self.connection_mgr.current_retry += 1
                delay = await self.connection_mgr.delay_with_jitter()
                print(
                    f"🔄 Reconnecting in {delay:.1f} seconds (attempt {self.connection_mgr.current_retry})..."
                )

    async def heartbeat(self, websocket):
        while self.is_running:
            try:
                await asyncio.sleep(self.heartbeat_interval)
                if websocket.open:
                    await websocket.ping()
                    self.last_heartbeat = datetime.now()
            except Exception:
                break


async def main():
    tracker = GlobalVesselTracker()
    try:
        await tracker.start()
    except KeyboardInterrupt:
        print("\n👋 Shutting down gracefully...")
        tracker.is_running = False


if __name__ == "__main__":
    print("🚀 Starting Global Vessel Tracker...")
    asyncio.run(main())
