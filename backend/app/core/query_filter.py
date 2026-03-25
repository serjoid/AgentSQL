import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class QueryAnalysis:
    is_destructive: bool
    operation_type: Optional[str]
    tables_affected: list[str]
    requires_confirmation: bool
    raw_query: str
    normalized_query: str


class QueryFilter:
    DESTRUCTIVE_KEYWORDS = [
        'UPDATE',
        'DELETE',
        'DROP',
        'ALTER',
        'TRUNCATE',
        'INSERT'
    ]
    
    COMMENT_PATTERNS = [
        r'--[^\n]*',
        r'/\*.*?\*/',
        r'#[^\n]*'
    ]
    
    TABLE_PATTERNS = {
        'UPDATE': r'UPDATE\s+(?:IF\s+EXISTS\s+)?[`"\[]?(\w+)[`"\]]?',
        'DELETE': r'FROM\s+(?:ONLY\s+)?[`"\[]?(\w+)[`"\]]?',
        'DROP': r'DROP\s+(?:TABLE|INDEX|VIEW|SCHEMA)\s+(?:IF\s+EXISTS\s+)?[`"\[]?(\w+)[`"\]]?',
        'ALTER': r'ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?[`"\[]?(\w+)[`"\]]?',
        'TRUNCATE': r'TRUNCATE\s+(?:TABLE\s+)?(?:IF\s+EXISTS\s+)?[`"\[]?(\w+)[`"\]]?',
        'INSERT': r'INTO\s+[`"\[]?(\w+)[`"\]]?',
    }
    
    def strip_comments(self, query: str) -> str:
        result = query
        for pattern in self.COMMENT_PATTERNS:
            result = re.sub(pattern, '', result, flags=re.DOTALL | re.IGNORECASE)
        return result
    
    def normalize_query(self, query: str) -> str:
        stripped = self.strip_comments(query)
        normalized = re.sub(r'\s+', ' ', stripped).strip()
        return normalized
    
    def extract_first_keyword(self, query: str) -> Optional[str]:
        normalized = self.normalize_query(query)
        match = re.match(r'^\s*(\w+)', normalized, re.IGNORECASE)
        if match:
            return match.group(1).upper()
        return None
    
    def extract_tables(self, query: str, operation: str) -> list[str]:
        tables = []
        pattern = self.TABLE_PATTERNS.get(operation)
        if pattern:
            matches = re.finditer(pattern, query, re.IGNORECASE)
            for match in matches:
                table_name = match.group(1)
                if table_name:
                    tables.append(table_name)
        return list(dict.fromkeys(tables))
    
    def analyze(self, query: str) -> QueryAnalysis:
        if not query or not query.strip():
            return QueryAnalysis(
                is_destructive=False,
                operation_type=None,
                tables_affected=[],
                requires_confirmation=False,
                raw_query=query,
                normalized_query=""
            )
        
        normalized = self.normalize_query(query)
        first_keyword = self.extract_first_keyword(query)
        
        is_destructive = False
        operation_type = None
        tables_affected = []
        
        if first_keyword and first_keyword in self.DESTRUCTIVE_KEYWORDS:
            is_destructive = True
            operation_type = first_keyword
            tables_affected = self.extract_tables(query, first_keyword)
        
        return QueryAnalysis(
            is_destructive=is_destructive,
            operation_type=operation_type,
            tables_affected=tables_affected,
            requires_confirmation=is_destructive,
            raw_query=query,
            normalized_query=normalized
        )
    
    def is_safe(self, query: str) -> bool:
        analysis = self.analyze(query)
        return not analysis.is_destructive
    
    def requires_confirmation(self, query: str) -> bool:
        analysis = self.analyze(query)
        return analysis.requires_confirmation


query_filter = QueryFilter()
