#!/bin/bash
# Quick database access script for CatchUp Supabase database
# Password is loaded from ~/.pgpass automatically

/opt/homebrew/opt/postgresql@15/bin/psql \
  -h aws-1-eu-west-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.ejhqzvmlurlvkypmmjyl \
  -d postgres \
  "$@"
