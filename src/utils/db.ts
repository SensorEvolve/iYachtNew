// Change the import statement to use default import
import SQLite from "expo-sqlite";
import { WebSQLDatabase, SQLTransaction } from "expo-sqlite";
import { Yacht } from "../Types/yacht";

const DB_NAME = "yachts.db";
const db: WebSQLDatabase = SQLite.openDatabaseSync(DB_NAME);

// Rest of your db.ts implementation remains the same
export interface ImageRecord {
  yacht_id: number;
  image_type: "main" | "detail";
  image_data: string;
  image_order?: number;
}

// Continue with rest of the code...

// Utility type for error handling
interface SQLError {
  message: string;
}

export const initDatabase = async (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: SQLTransaction) => {
        // Create main yachts table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS yachts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            built_by TEXT,
            yacht_type TEXT,
            length TEXT,
            top_speed TEXT,
            cruise_speed TEXT,
            range TEXT,
            crew TEXT,
            delivered TEXT,
            beam TEXT,
            guests TEXT,
            refit TEXT,
            flag TEXT,
            exterior_designer TEXT,
            interior_designer TEXT,
            short_info TEXT,
            owner TEXT,
            price TEXT,
            seized_by TEXT,
            image_name TEXT
          );`,
        );

        // Create images table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS yacht_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            yacht_id INTEGER,
            image_type TEXT CHECK(image_type IN ('main', 'detail')),
            image_data BLOB,
            image_order INTEGER,
            FOREIGN KEY (yacht_id) REFERENCES yachts (id)
          );`,
        );

        // Create favorites table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS favorites (
            yacht_id INTEGER PRIMARY KEY,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (yacht_id) REFERENCES yachts (id)
          );`,
        );
      },
      (error: SQLError) => {
        console.error("Database initialization error:", error);
        reject(error);
        return false;
      },
      () => {
        console.log("Database initialized successfully");
        resolve(true);
      },
    );
  });
};

export const getYachts = async (): Promise<Yacht[]> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT y.*, 
                CASE WHEN f.yacht_id IS NOT NULL THEN 1 ELSE 0 END as isFavorite
         FROM yachts y
         LEFT JOIN favorites f ON y.id = f.yacht_id;`,
        [],
        (_, { rows }) =>
          resolve(
            rows._array.map((row) => ({
              ...row,
              isFavorite: Boolean(row.isFavorite),
            })),
          ),
        (_, error) => {
          console.error("Error getting yachts:", error);
          reject(error);
          return false;
        },
      );
    });
  });
};

export const getYachtImages = async (
  yachtId: number,
): Promise<ImageRecord[]> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM yacht_images 
         WHERE yacht_id = ? 
         ORDER BY image_type DESC, image_order ASC;`,
        [yachtId],
        (_, { rows }) => resolve(rows._array),
        (_, error) => {
          console.error("Error getting yacht images:", error);
          reject(error);
          return false;
        },
      );
    });
  });
};

export const saveYachtImage = async (
  yachtId: number,
  imageType: "main" | "detail",
  imageData: string,
  imageOrder: number = 0,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO yacht_images (yacht_id, image_type, image_data, image_order)
         VALUES (?, ?, ?, ?);`,
        [yachtId, imageType, imageData, imageOrder],
        (_, result) => resolve(),
        (_, error) => {
          console.error("Error saving yacht image:", error);
          reject(error);
          return false;
        },
      );
    });
  });
};

export const toggleFavorite = async (yachtId: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO favorites (yacht_id)
         SELECT ? WHERE NOT EXISTS (
           SELECT 1 FROM favorites WHERE yacht_id = ?
         );`,
        [yachtId, yachtId],
        (_, result) => {
          if (result.rowsAffected === 0) {
            tx.executeSql(
              `DELETE FROM favorites WHERE yacht_id = ?;`,
              [yachtId],
              () => resolve(),
              (_, error) => {
                console.error("Error removing favorite:", error);
                reject(error);
                return false;
              },
            );
          } else {
            resolve();
          }
        },
        (_, error) => {
          console.error("Error toggling favorite:", error);
          reject(error);
          return false;
        },
      );
    });
  });
};

// Add type declaration for database
export type DB = typeof db;

// Add data migration function
export const migrateDataToDatabase = async (yachts: Yacht[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        yachts.forEach((yacht) => {
          tx.executeSql(
            `INSERT INTO yachts (
              name, built_by, yacht_type, length, top_speed, cruise_speed,
              range, crew, delivered, beam, guests, refit, flag,
              exterior_designer, interior_designer, short_info, owner,
              price, seized_by, image_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              yacht.name,
              yacht.builtBy,
              yacht.yachtType,
              yacht.length,
              yacht.topSpeed,
              yacht.cruiseSpeed,
              yacht.range,
              yacht.crew,
              yacht.delivered,
              yacht.beam,
              yacht.guests,
              yacht.refit,
              yacht.flag,
              yacht.exteriorDesigner,
              yacht.interiorDesigner,
              yacht.shortInfo,
              yacht.owner,
              yacht.price,
              yacht.seizedBy,
              yacht.imageName,
            ],
            undefined,
            (_, error) => {
              console.error("Error inserting yacht:", error);
              return false;
            },
          );
        });
      },
      (error) => {
        console.error("Transaction error:", error);
        reject(error);
      },
      () => {
        console.log("Data migration completed successfully");
        resolve();
      },
    );
  });
};
