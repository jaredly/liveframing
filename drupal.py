#!/usr/bin/env python

import os,sys

sys.path.append('/home1/marketr5/lib64/python2.4/site-packages')

import MySQLdb
pwd = open('/home1/marketr5/.liveframe').read().strip()


class MySQL:
    def __init__(self):
        self.db = MySQLdb.connect("localhost", "gamecc", "drupal", "drupal")
        self.cursor = self.db.cursor()
        
    def __del__(self):
        self.db.quit()
        
    def get_all(self,table):
        self.cursor.execute("select * from %s"%table)
        return self.cursor.fetchall()
        
    def get_row(self,table,key,val):
        self.cursor.execute("select * from %s where %s is '%s'"%(table,key,val))
        return self.cursor.fetchone()
        
    def get_column(self,table,column):
        self.cursor.execute("select %s from %s"%(column,table))
        return self.cursor.fetchall()

def getcookies():
 if 'HTTP_COOKIE' in os.environ:
  cookies = os.environ['HTTP_COOKIE']
  cookies = cookies.split('; ')
  handler = {}
  
  for cookie in cookies:
    cookie = cookie.split('=')
    handler[cookie[0]] = cookie[1]
  
  return handler

def login():
  cookies = getcookies()
  db = MySQLdb.connect("localhost", "marketr5", pwd, "marketr5_drupal")
  cursor = db.cursor()
  for cookie in cookies:
    if cookie.startswith('SESS'):
      cursor.execute('select * from sessions where sid="'+cookies[cookie]+'"')
      sess = cursor.fetchone()
      if sess:
        cursor.execute('select name from users where uid=%d'%sess[0])
        name = cursor.fetchone()[0]
        if not name:return 0,''
        return 1, name
  return 0,''
