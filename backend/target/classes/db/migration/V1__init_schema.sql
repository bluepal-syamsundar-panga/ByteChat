-- Create sequence for entities
-- Note: Spring Boot creates sequences automatically for bigserial, so these sequences are implicitly handled by PostgreSQL.

CREATE TABLE users (
    id bigserial not null,
    avatar_url varchar(255),
    display_name varchar(255) not null,
    email varchar(255) not null unique,
    last_seen timestamp(6),
    online boolean not null,
    password varchar(255) not null,
    role varchar(255) not null check (role in ('OWNER','MEMBER')),
    primary key (id)
);

CREATE TABLE rooms (
    id bigserial not null,
    created_at timestamp(6) not null,
    description varchar(255),
    is_archived boolean not null,
    is_private boolean not null,
    name varchar(255) not null,
    created_by bigint not null,
    primary key (id),
    constraint FKoo674xs5ix0itmepevaj1j6ku foreign key (created_by) references users (id)
);

CREATE TABLE messages (
    id bigserial not null,
    content text not null,
    edited_at timestamp(6),
    is_deleted boolean not null,
    is_pinned boolean not null,
    sent_at timestamp(6) not null,
    type varchar(255),
    room_id bigint not null,
    sender_id bigint not null,
    primary key (id),
    constraint FK92hs6y8g4al98ihp4ms6nbxeq foreign key (room_id) references rooms (id),
    constraint FK4ui4nnwntodh6wjvck53dbk9m foreign key (sender_id) references users (id)
);

CREATE TABLE attachments (
    id bigserial not null,
    file_name varchar(255) not null,
    file_size bigint,
    file_type varchar(255) not null,
    file_url varchar(255) not null,
    uploaded_at timestamp(6) not null,
    message_id bigint,
    uploader_id bigint not null,
    primary key (id),
    constraint FKcf4ta8qdkixetfy7wnqfv3vkv foreign key (message_id) references messages (id),
    constraint FKr60r9lnkb1bv66bqanw3vb4ne foreign key (uploader_id) references users (id)
);

CREATE TABLE direct_messages (
    id bigserial not null,
    content text not null,
    is_deleted boolean not null,
    read_at timestamp(6),
    sent_at timestamp(6) not null,
    type varchar(255),
    from_user_id bigint not null,
    to_user_id bigint not null,
    primary key (id),
    constraint FK7jcln0adoq6mv6p71x1y5aln3 foreign key (from_user_id) references users (id),
    constraint FK8prvpwn46hap1dbp8xwh63wlf foreign key (to_user_id) references users (id)
);

CREATE TABLE notifications (
    id bigserial not null,
    content varchar(255) not null,
    created_at timestamp(6) not null,
    is_read boolean not null,
    related_entity_id bigint,
    type varchar(255) not null,
    recipient_id bigint not null,
    primary key (id),
    constraint FKqqnsjxlwleyjbxlmm213jaj3f foreign key (recipient_id) references users (id)
);

CREATE TABLE reactions (
    id bigserial not null,
    created_at timestamp(6) not null,
    emoji varchar(255) not null,
    message_id bigint not null,
    user_id bigint not null,
    primary key (id),
    constraint FKlmwgdoo3g3f4g0wsgc1lmwfby foreign key (message_id) references messages (id),
    constraint FKqmewaibcp5bxtlqxc2cawhuln foreign key (user_id) references users (id)
);

CREATE TABLE room_members (
    id bigserial not null,
    joined_at timestamp(6) not null,
    room_id bigint not null,
    user_id bigint not null,
    primary key (id),
    constraint FK1bbl9rh6ae8v6mebaoq2ilg9g foreign key (room_id) references rooms (id),
    constraint FKmcymqhedxe30d98p07eeqo3my foreign key (user_id) references users (id)
);
