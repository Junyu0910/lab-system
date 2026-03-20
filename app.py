"""
实验室管理系统 - 后端服务
运行方式: uvicorn app:app --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import sqlite3, json, os

app = FastAPI(title="实验室管理系统")

# 允许所有来源（局域网内使用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB = "lab.db"

# ── 数据库初始化 ──────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS members (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            name    TEXT NOT NULL,
            role    TEXT,
            email   TEXT,
            phone   TEXT,
            projects TEXT,
            color   TEXT DEFAULT '#E8C547'
        );
        CREATE TABLE IF NOT EXISTS meetings (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            date      TEXT,
            title     TEXT NOT NULL,
            attendees TEXT,
            notes     TEXT,
            action    TEXT
        );
        CREATE TABLE IF NOT EXISTS todos (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            text     TEXT NOT NULL,
            done     INTEGER DEFAULT 0,
            priority TEXT DEFAULT 'medium',
            due      TEXT
        );
        CREATE TABLE IF NOT EXISTS mice (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            cage_no     TEXT NOT NULL,
            strain      TEXT,
            mating_unit TEXT,
            exp_cages   INTEGER DEFAULT 0,
            notes       TEXT
        );
        CREATE TABLE IF NOT EXISTS onboarding (
            id   INTEGER PRIMARY KEY AUTOINCREMENT,
            task TEXT NOT NULL,
            done INTEGER DEFAULT 0
        );
    """)

    # 插入默认入职清单（如果为空）
    if c.execute("SELECT COUNT(*) FROM onboarding").fetchone()[0] == 0:
        tasks = [
            "签署实验室安全协议", "完成安全培训课程", "获取门禁卡",
            "注册实验记录账号", "与导师确认项目课题", "熟悉实验室设备位置", "加入实验室微信群"
        ]
        c.executemany("INSERT INTO onboarding(task) VALUES(?)", [(t,) for t in tasks])

    conn.commit()
    conn.close()

init_db()

# ── 数据模型 ──────────────────────────────────────────────────────────────────
class Member(BaseModel):
    name: str
    role: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    projects: Optional[str] = ""   # JSON字符串 或 逗号分隔
    color: Optional[str] = "#E8C547"

class Meeting(BaseModel):
    date: Optional[str] = ""
    title: str
    attendees: Optional[str] = ""  # 逗号分隔
    notes: Optional[str] = ""
    action: Optional[str] = ""

class Todo(BaseModel):
    text: str
    done: Optional[bool] = False
    priority: Optional[str] = "medium"
    due: Optional[str] = ""

class TodoUpdate(BaseModel):
    done: Optional[bool] = None
    text: Optional[str] = None
    priority: Optional[str] = None
    due: Optional[str] = None

class Mouse(BaseModel):
    cage_no: str
    strain: Optional[str] = ""
    mating_unit: Optional[str] = ""
    exp_cages: Optional[int] = 0
    notes: Optional[str] = ""

class OnboardUpdate(BaseModel):
    done: bool

# ── 成员 API ──────────────────────────────────────────────────────────────────
@app.get("/api/members")
def get_members():
    conn = get_db()
    rows = conn.execute("SELECT * FROM members ORDER BY id").fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        try:
            d["projects"] = json.loads(d["projects"]) if d["projects"] else []
        except:
            d["projects"] = [p.strip() for p in (d["projects"] or "").split(",") if p.strip()]
        d["avatar"] = d["name"][0] if d["name"] else "？"
        result.append(d)
    return result

@app.post("/api/members")
def add_member(m: Member):
    projects = m.projects if m.projects else ""
    # 统一存为JSON
    try:
        json.loads(projects)
    except:
        projects = json.dumps([p.strip() for p in projects.split(",") if p.strip()], ensure_ascii=False)
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO members(name,role,email,phone,projects,color) VALUES(?,?,?,?,?,?)",
        (m.name, m.role, m.email, m.phone, projects, m.color)
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"id": new_id, "message": "添加成功"}

@app.delete("/api/members/{member_id}")
def delete_member(member_id: int):
    conn = get_db()
    conn.execute("DELETE FROM members WHERE id=?", (member_id,))
    conn.commit()
    conn.close()
    return {"message": "删除成功"}

# ── 会议 API ──────────────────────────────────────────────────────────────────
@app.get("/api/meetings")
def get_meetings():
    conn = get_db()
    rows = conn.execute("SELECT * FROM meetings ORDER BY date DESC, id DESC").fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["attendees"] = [a.strip() for a in (d["attendees"] or "").split(",") if a.strip()]
        result.append(d)
    return result

@app.post("/api/meetings")
def add_meeting(m: Meeting):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO meetings(date,title,attendees,notes,action) VALUES(?,?,?,?,?)",
        (m.date, m.title, m.attendees, m.notes, m.action)
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"id": new_id, "message": "添加成功"}

@app.delete("/api/meetings/{meeting_id}")
def delete_meeting(meeting_id: int):
    conn = get_db()
    conn.execute("DELETE FROM meetings WHERE id=?", (meeting_id,))
    conn.commit()
    conn.close()
    return {"message": "删除成功"}

# ── 待办 API ──────────────────────────────────────────────────────────────────
@app.get("/api/todos")
def get_todos():
    conn = get_db()
    rows = conn.execute("SELECT * FROM todos ORDER BY done, id DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/todos")
def add_todo(t: Todo):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO todos(text,done,priority,due) VALUES(?,?,?,?)",
        (t.text, 1 if t.done else 0, t.priority, t.due)
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"id": new_id, "message": "添加成功"}

@app.patch("/api/todos/{todo_id}")
def update_todo(todo_id: int, t: TodoUpdate):
    conn = get_db()
    if t.done is not None:
        conn.execute("UPDATE todos SET done=? WHERE id=?", (1 if t.done else 0, todo_id))
    if t.text is not None:
        conn.execute("UPDATE todos SET text=? WHERE id=?", (t.text, todo_id))
    if t.priority is not None:
        conn.execute("UPDATE todos SET priority=? WHERE id=?", (t.priority, todo_id))
    if t.due is not None:
        conn.execute("UPDATE todos SET due=? WHERE id=?", (t.due, todo_id))
    conn.commit()
    conn.close()
    return {"message": "更新成功"}

@app.delete("/api/todos/{todo_id}")
def delete_todo(todo_id: int):
    conn = get_db()
    conn.execute("DELETE FROM todos WHERE id=?", (todo_id,))
    conn.commit()
    conn.close()
    return {"message": "删除成功"}

# ── 小鼠 API ──────────────────────────────────────────────────────────────────
@app.get("/api/mice")
def get_mice():
    conn = get_db()
    rows = conn.execute("SELECT * FROM mice ORDER BY cage_no").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/mice")
def add_mouse(m: Mouse):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO mice(cage_no,strain,mating_unit,exp_cages,notes) VALUES(?,?,?,?,?)",
        (m.cage_no, m.strain, m.mating_unit, m.exp_cages, m.notes)
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"id": new_id, "message": "添加成功"}

@app.delete("/api/mice/{mouse_id}")
def delete_mouse(mouse_id: int):
    conn = get_db()
    conn.execute("DELETE FROM mice WHERE id=?", (mouse_id,))
    conn.commit()
    conn.close()
    return {"message": "删除成功"}

# ── 入职清单 API ──────────────────────────────────────────────────────────────
@app.get("/api/onboarding")
def get_onboarding():
    conn = get_db()
    rows = conn.execute("SELECT * FROM onboarding ORDER BY id").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.patch("/api/onboarding/{item_id}")
def update_onboarding(item_id: int, u: OnboardUpdate):
    conn = get_db()
    conn.execute("UPDATE onboarding SET done=? WHERE id=?", (1 if u.done else 0, item_id))
    conn.commit()
    conn.close()
    return {"message": "更新成功"}

# ── 提供前端页面 ──────────────────────────────────────────────────────────────
@app.get("/")
def serve_frontend():
    return FileResponse("index.html")
