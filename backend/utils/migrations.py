"""
Database migration utility for automatic schema updates.
Runs migrations on backend startup to keep database in sync.
"""

import os
from pathlib import Path
from supabase import Client
import logging

logger = logging.getLogger(__name__)


class MigrationManager:
    """Manages database migrations automatically."""
    
    def __init__(self, supabase_client: Client):
        self.client = supabase_client
        self.migrations_dir = Path(__file__).parent.parent.parent / "database" / "migrations"
    
    def _check_table_exists(self, table_name: str) -> bool:
        """Check if a table exists in the database."""
        try:
            # Try to query the table - if it doesn't exist, this will fail
            self.client.table(table_name).select("*").limit(1).execute()
            return True
        except Exception:
            return False
    
    def _check_column_exists(self, table_name: str, column_name: str) -> bool:
        """Check if a column exists in a table."""
        try:
            # Try to select the specific column
            self.client.table(table_name).select(column_name).limit(1).execute()
            return True
        except Exception:
            return False
    
    def check_migrations_needed(self) -> dict:
        """
        Check which migrations are needed.
        Returns a dict with migration status.
        """
        status = {
            "user_connections_table": False,
            "relatives_is_external_column": False,
            "migrations_needed": False
        }
        
        # Check if user_connections table exists
        status["user_connections_table"] = self._check_table_exists("user_connections")
        
        # Check if relatives.is_external column exists
        if self._check_table_exists("relatives"):
            status["relatives_is_external_column"] = self._check_column_exists("relatives", "is_external")
        
        # Determine if migrations are needed
        status["migrations_needed"] = not (
            status["user_connections_table"] and 
            status["relatives_is_external_column"]
        )
        
        return status
    
    def get_migration_instructions(self) -> str:
        """Get instructions for applying migrations manually."""
        instructions = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                         DATABASE MIGRATION REQUIRED                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

Your database schema needs to be updated for the Enhanced Connections feature.

RECOMMENDED: Use the Complete Schema File
────────────────────────────────────────────────────
1. Go to your Supabase Dashboard
2. Navigate to: SQL Editor
3. Click "New Query"
4. Copy the contents of: database/supabase-schema.sql
5. Paste into the SQL Editor
6. Click "Run" or press Ctrl+Enter
7. Restart your backend server

Note: This will create all tables. Existing tables will be skipped (no data loss).

WHAT'S MISSING:
────────────────────────────────────────────────────
✓ 'user_connections' table for linked connections
✓ 'is_external' column in 'relatives' table
✓ Performance indexes
✓ Row Level Security policies

After applying the schema, restart your backend server.

╚══════════════════════════════════════════════════════════════════════════════╝
"""
        return instructions
    
    def run_migrations(self):
        """Check migration status and provide instructions if needed."""
        if not self.migrations_dir.exists():
            logger.info("No migrations directory found")
            return
        
        logger.info("Checking database schema...")
        
        status = self.check_migrations_needed()
        
        if not status["migrations_needed"]:
            logger.info("✓ Database schema is up to date")
            return
        
        # Log what's missing
        if not status["user_connections_table"]:
            logger.warning("✗ Missing table: user_connections")
        
        if not status["relatives_is_external_column"]:
            logger.warning("✗ Missing column: relatives.is_external")
        
        # Print instructions
        print(self.get_migration_instructions())
        
        logger.warning("Database migration required - see instructions above")


def run_migrations_on_startup(supabase_client: Client):
    """
    Check database migrations on application startup.
    Call this from main.py during FastAPI startup.
    """
    try:
        manager = MigrationManager(supabase_client)
        manager.run_migrations()
    except Exception as e:
        logger.error(f"Migration check error: {e}")
        logger.warning("Could not verify database schema")
