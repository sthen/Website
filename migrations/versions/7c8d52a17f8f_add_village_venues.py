"""add_village_venues

Revision ID: 7c8d52a17f8f
Revises: 089956059475
Create Date: 2022-05-07 20:47:38.189635

"""

# revision identifiers, used by Alembic.
revision = '7c8d52a17f8f'
down_revision = '089956059475'

from alembic import op
import sqlalchemy as sa


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('venue', sa.Column('village_id', sa.Integer(), nullable=True))
    op.add_column('venue', sa.Column('scheduled_content_only', sa.Boolean(), nullable=True))
    op.create_foreign_key(op.f('fk_venue_village_id_village'), 'venue', 'village', ['village_id'], ['id'])
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(op.f('fk_venue_village_id_village'), 'venue', type_='foreignkey')
    op.drop_column('venue', 'scheduled_content_only')
    op.drop_column('venue', 'village_id')
    # ### end Alembic commands ###
