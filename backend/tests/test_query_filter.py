"""Tests for QueryFilter — HITL filter core logic."""

import pytest
from app.core.query_filter import QueryFilter, QueryAnalysis

qf = QueryFilter()


class TestStripComments:
    def test_strips_line_comment(self):
        assert "--remove me" not in qf.strip_comments("SELECT 1 -- remove me")

    def test_strips_block_comment(self):
        result = qf.strip_comments("SELECT /* secret */ 1")
        assert "secret" not in result

    def test_preserves_query_body(self):
        result = qf.strip_comments("SELECT id FROM users")
        assert "SELECT" in result


class TestAnalyze:
    def test_select_is_safe(self):
        a = qf.analyze("SELECT * FROM users")
        assert a.is_destructive is False
        assert a.operation_type is None
        assert a.requires_confirmation is False

    def test_empty_query_is_safe(self):
        a = qf.analyze("")
        assert a.is_destructive is False

    def test_update_is_destructive(self):
        a = qf.analyze("UPDATE users SET name = 'x' WHERE id = 1")
        assert a.is_destructive is True
        assert a.operation_type == "UPDATE"
        assert "users" in a.tables_affected

    def test_delete_is_destructive(self):
        a = qf.analyze("DELETE FROM orders WHERE id = 42")
        assert a.is_destructive is True
        assert a.operation_type == "DELETE"

    def test_drop_is_destructive(self):
        a = qf.analyze("DROP TABLE IF EXISTS sessions")
        assert a.is_destructive is True
        assert a.operation_type == "DROP"

    def test_truncate_is_destructive(self):
        a = qf.analyze("TRUNCATE TABLE logs")
        assert a.is_destructive is True
        assert a.operation_type == "TRUNCATE"

    def test_insert_is_destructive(self):
        a = qf.analyze("INSERT INTO accounts (name) VALUES ('alice')")
        assert a.is_destructive is True
        assert a.operation_type == "INSERT"

    def test_requires_confirmation_matches_destructive(self):
        safe = qf.analyze("SELECT 1")
        danger = qf.analyze("DELETE FROM x")
        assert safe.requires_confirmation is False
        assert danger.requires_confirmation is True

    def test_comment_injection_does_not_hide_delete(self):
        # SQL comment injection attempt — should still detect DELETE
        a = qf.analyze("/* legit */ DELETE FROM users")
        assert a.is_destructive is True

    def test_normalized_query_removes_extra_whitespace(self):
        a = qf.analyze("SELECT   *   FROM   users")
        assert "  " not in a.normalized_query
