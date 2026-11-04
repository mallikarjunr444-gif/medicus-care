"""add consultation_reports

Revision ID: 0005
Revises: 0004
"""

import sqlalchemy as sa
from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "consultation_reports",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("session_id", sa.String(), sa.ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("doctor_id", sa.String(), nullable=True),
        sa.Column("language", sa.String(), nullable=True),
        sa.Column("triage_level", sa.Integer(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("report", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_consultation_reports_session_id", "consultation_reports", ["session_id"], unique=True)
    op.create_index("ix_consultation_reports_user_id", "consultation_reports", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_consultation_reports_user_id", table_name="consultation_reports")
    op.drop_index("ix_consultation_reports_session_id", table_name="consultation_reports")
    op.drop_table("consultation_reports")
