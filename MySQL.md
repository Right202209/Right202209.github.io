```mysql
/*查询所有数据库*/
show databases ;

/*创建数据库*/
create database if exists test_db;

/*使用数据库*/
use test_db;

/*查询当前数据库*/
select database();

/*删除数据库*/
drop database if exists test_db;

/*创建表*/
create table table01(
    id int comment '序号',      /**/
    name char(50) comment '姓名',
    age int comment '年龄',
    gender char(1) comment '性别',
    birthday date comment '生日',
    Phone varchar(11) comment '电话',
    QQ varchar(15) ,
    remark text comment '备注'
)comment '表';

/*查询当前数据库所有表*/
show tables ;

/*查询表结构*/
desc table01;

/*查询指定表建表语句*/
show create table table01;

-- 表修改 DDL

/*添加字段*/
alter table table1 add qq varchar(20) comment 'QQnumber';
alter table table01 add birthday date comment '生日';
alter table table01 add remark text comment '备注';

/*修改数据类型*/
alter table table1 modify name varchar(20);

/*修改字段名和字段类型*/
alter table table1 change realage age int comment '周岁';

/*删除字段*/
alter table table1 drop  qq;

/*修改表名*/
alter table table1 rename to table01;

/*查询表结构（新表名）*/
desc table01;

/*删除表*/
drop table if exists table1;

/*清空表中内容*/
truncate table table01;

-- DML

/*给指定字段添加数据*/
insert into table01(id,name,age,gender) values(1,'csq',18,'女');

/*给全部字段添加数据*/
insert into table01(id,name,age,gender,birthday) values(3,'张三',28,'男','2000-10-01');
insert int table01 values(4,'李四',28,'男','1995-05-16');

/*修改数据*/
update table01 set name= '陈世琦',age=19 where name='csq';
update table01 set name= '孙照权',age=19 where name='szq';
update table01 set birthday='2000-10-02' where birthday>'2023-07-27';

/*删除数据(条件)*/
delete from table01 where remark='无';

/*删除全部*/
delete from new_table;

-- DQL

/*查询*/
select *from table01;

/*查询多个字段*/
select name,QQ from table01;

/*设置别名*/*/*/
select  birthday as bir from table01;

/*去出重复数据*/*/
select distinct remark from table01;

/*（条件查询）*/

/*年龄等于*/
select *from table01 where age=18;

/*年龄小于等于*/
select *from table01 where age<=18;

/*不存在*/
select *from table01 where age is null ;

/*存在*/
select *from table01 where age is not null;

/*不等于*/
select *from table01 where age!=18;
/*
select *from table01 where age <>18;
*/

/*在某一范围*/
select *from table01 where age >= 15 && age <= 20;
/* 
select *from table01 where age >= 15 and age <= 20;
select *from table01 where age between 15 and 20;    先小后大
*/

/*条件 并*/
select *from table01 where gender='女'&& age<20;

/*条件 或*/
select *from table01 where age=18 or age=25;
/*
select *from table01 where age in(18,25);
*/

/*查找（几个字符的数据 ps:三个字名字用三个下划线）*/
select  *from table01 where name like '___';

/*查照最后一位（%可代替前边所有）*/
select  *from table01 where QQ like '%3';

/*（聚合函数）*/

/*数量*/
select count(*) from table01;-- * 可替换

/*平均*/
select avg(age) from table01;

/*最大*/
select max(age) from table01;

/*最小*/
select min(age) from table01;

/*求和*/
select sum(age) from table01 where gender='女';

/*（分组查询）*/

select gender,count(*) from table01 group by gender ;

select gender,avg(age) from table01 group by gender;

select *from table01 where age < 20 group by id;

-- 排序查询

/*升序id*/
select * from table01 order by id asc ;
/*select * from table01 order by age ;*/

/*降序年龄*/
select * from table01 order by age desc ;

/*多字段*/
select *from table01 order by  age ,id desc;

-- 分页查询
    -- 起始索引从0开始， 起始索引= （查询页码 - 1）*每页显示记录数
    -- 第一页数据 起始索引可以省略 简写为 limit 10
/*查询第一页数据，每页展示5条数据*/
select *from table01 limit 0 , 5;
/*查询第二页数据，每页展示5条数据*/
select *from table01 limit 5 , 5;

-- 管理用户DCL

/*查询用户*/
use mysql;
select *from user;

/*创建用户-本机*/
create user 'dsz'@'localhost' identified by '123456';

/*创建用户-任意主机*/
create user 'dcm'@'%' identified by '123456';

/*修改用户密码*/
alter user 'dsz'@'localhost' identified by '12345';

/*删除用户*/
drop user  'dcm'@'%';

/*权限控制*/

/*查询权限*/
show grants for 'dsz'@'localhost';

/*授予权限*/
grant update on test_db.table01 to 'dsz'@'localhost';

/*撤销权限*/
revoke update on test_db.table01 from 'dsz'@'localhost';

-- 函数
-- 字符串函数
/*
concot(s1,s2,s3...)         字符串拼接
lower(str)                  将字符串全部转换为小写
upper(str)                  将字符串全部转换为大写
lpad(str,n,pad)             左填充，用pad对str的左边进行填充，达到n个字符串
rpad(str,n,pad)             右填充，用pad对str的右边进行填充，达到n个字符串
trim(str)                   去掉字符串头部和尾部的空格
substring(str,start,len)    返回从字符串str从start位置起的len个长度的字符串
*/
/*字符串拼接*/
select concat('Hello','Mysql');

/*转换小写*/
select lower('HELLO');

/*转换大写*/
select UPPER('HELLO');

/*左填充*/
select lpad('5',9,'_');
update table01 set QQ = lpad( qq ,10 ,' ');


/*右填充*/
select rpad('5',9,'_');
update table01 set Phone = rpad( Phone ,11 ,'0');

/*去除两边空格*/
select trim('  hello  mysql  ');

/*取start开始len长度的字符串*/
select substring('hello Mysql',3,6);



/**/
select @@autocommit;

set @@


/*查看事务隔离级别*/
select @@transaction_isolation;

/*设置
	read uncommitted
	read committed
	repeatable read （默认）
	serializable
*/

set session transaction isolation level read uncommitted;

set session transaction isolation level repeatable read; -- 默认

```