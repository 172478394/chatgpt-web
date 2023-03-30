package model

import (
    "github.com/869413421/chatgpt-web/config"
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
    gloger "gorm.io/gorm/logger"
    "log"
    "os"
    "time"

    "github.com/869413421/chatgpt-web/pkg/types"
)

// BaseModel 主模型
type BaseModel struct {
    ID        uint64    `gorm:"column:id;primaryKey;autoIncrement;not null"`
    CreatedAt time.Time `gorm:"column:created_at;index"`
    UpdatedAt time.Time `gorm:"column:updated_at;index"`
}

// GetStringID 获取主键字符串
func (model BaseModel) GetStringID() string {
    return types.UInt64ToString(model.ID)
}

// CreatedAtDate 获取创建时间
func (model BaseModel) CreatedAtDate() string {
    return model.CreatedAt.Format("2006-01-02")
}

var DB *gorm.DB

func ConnectDB() *gorm.DB {
    newLogger := gloger.New(
        log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
        gloger.Config{
            SlowThreshold: 10 * time.Millisecond, // Slow SQL threshold
            LogLevel:      gloger.Error,          // Log level
            Colorful:      true,                  // Disable color
        },
    )

    dsn := config.LoadConfig().Dsn

    var err error
    DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
        Logger:            newLogger,
        PrepareStmt:       true,
        AllowGlobalUpdate: false,
    })
    if err != nil {
        panic(err)
    }

    sqlDB, err := DB.DB()
    if err != nil {
        panic(err)
    }

    err = sqlDB.Ping()
    if err != nil {
        panic(err)
    }

    sqlDB.SetMaxIdleConns(10)
    sqlDB.SetMaxOpenConns(100)
    sqlDB.SetConnMaxLifetime(10 * time.Minute)

    return DB
}
