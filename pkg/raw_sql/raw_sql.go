package rawsql

import (
	"fmt"
	"strings"
	"time"
)

func quoteLiteral(v interface{}) string {
	switch x := v.(type) {
	case nil:
		return "NULL"
	case time.Time:
		return fmt.Sprintf("'%s'", x.Format("2006-01-02 15:04:05"))
	case string:
		return "'" + strings.ReplaceAll(x, "'", "''") + "'"
	default:
		return fmt.Sprintf("'%v'", x)
	}
}

func BuildSQL(query string, args []interface{}) string {
	for i, v := range args {
		placeholder := fmt.Sprintf("$%d", i+1)
		query = strings.ReplaceAll(query, placeholder, quoteLiteral(v))
	}
	return strings.Join(strings.Fields(query), " ")
}
