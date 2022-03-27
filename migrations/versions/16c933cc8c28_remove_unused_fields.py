"""remove unused fields

Revision ID: 16c933cc8c28
Revises: 3a3f1d9d6ff0
Create Date: 2022-03-26 19:21:45.410814

"""

# revision identifiers, used by Alembic.
revision = '16c933cc8c28'
down_revision = '3a3f1d9d6ff0'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('user', 'phone')
    op.drop_column('user_version', 'phone')
    op.drop_column('volunteer', 'planned_departure')
    op.drop_column('volunteer', 'planned_arrival')
    op.drop_column('volunteer', 'missing_shifts_opt_in')
    op.drop_column('volunteer_version', 'planned_departure')
    op.drop_column('volunteer_version', 'planned_arrival')
    op.drop_column('volunteer_version', 'missing_shifts_opt_in')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('volunteer_version', sa.Column('missing_shifts_opt_in', sa.BOOLEAN(), autoincrement=False, nullable=True))
    op.add_column('volunteer_version', sa.Column('planned_arrival', postgresql.TIMESTAMP(), autoincrement=False, nullable=True))
    op.add_column('volunteer_version', sa.Column('planned_departure', postgresql.TIMESTAMP(), autoincrement=False, nullable=True))
    op.add_column('volunteer', sa.Column('missing_shifts_opt_in', sa.BOOLEAN(), autoincrement=False, nullable=False))
    op.add_column('volunteer', sa.Column('planned_arrival', postgresql.TIMESTAMP(), autoincrement=False, nullable=True))
    op.add_column('volunteer', sa.Column('planned_departure', postgresql.TIMESTAMP(), autoincrement=False, nullable=True))
    op.add_column('user_version', sa.Column('phone', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('user', sa.Column('phone', sa.VARCHAR(), autoincrement=False, nullable=True))
    # ### end Alembic commands ###
