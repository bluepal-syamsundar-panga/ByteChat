-- Create dm_requests table to handle direct message invitations
CREATE TABLE IF NOT EXISTS dm_requests (
    id bigserial not null,
    sender_id bigint not null,
    receiver_id bigint not null,
    status varchar(255) not null check (status in ('PENDING','ACCEPTED','REJECTED')),
    created_at timestamp(6) not null,
    responded_at timestamp(6),
    primary key (id),
    constraint FK_dm_requests_sender foreign key (sender_id) references users (id),
    constraint FK_dm_requests_receiver foreign key (receiver_id) references users (id)
);

-- Add indexes for common queries
CREATE INDEX idx_dm_requests_receiver_status ON dm_requests(receiver_id, status);
CREATE INDEX idx_dm_requests_sender_receiver ON dm_requests(sender_id, receiver_id);
