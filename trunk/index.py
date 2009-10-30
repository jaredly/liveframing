#!/usr/bin/env python

import os,sys,re
import cgi
import random

sys.stderr = sys.stdout
form = cgi.FieldStorage()


import subprocess

send_header = False

from utils import exit,die
import drupal

import inspect
import traceback
import re

loggedin = False
username = ''
base = None

def init():
  global loggedin, username, base
  loggedin, username = drupal.login()
  if loggedin:
    base = os.path.join('frames', username)
    if not os.path.exists(base):
      os.mkdir(base)

def get_username():
  print "{'error':'', 'loggedin':"+str(loggedin)+", 'username':'" + username + "', 'status':1}"

def list_frames():
  res = list(x for x in os.listdir(base) if x.endswith('.html'))
  print "{'error':'', 'frames':"+str(res)+", 'status':1}"

def sanitize(text):
  return text.replace('\\','\\\\').replace("'","\\'").replace('\n','')






def load():
  html = open(os.path.join(base, form['name'].value)).read()
  html = html[html.find(start) + len(start) + html[html.find(start) + len(start):].find('>')+1:html.find(end)]
  style = open(os.path.join(base, form['name'].value[:-4]+'css')).read()
  print "{'error':'', 'html':'"+sanitize(html)+"', 'style':'" + sanitize(style) + "', 'status':1}"

start = '<div style="" id="liveframe-main" class="'
end = '</div><!-- end #liveframe-main -->'

def humanize(name):
  return re.sub('(^\w|\W\w)',(lambda x:x.group().upper()), name)

def save():
  filename = os.path.join(base, form['name'].value)
  if not os.path.exists(filename):
    html = open('base.html').read()%(humanize(form['name'].value), form['name'], form['html'].value)
  else:
    html = open(filename).read()
    html = html[:html.find(start)] + form['html'].value + html[html.find(end) + len(end)]
  style = form['style'].value
  open(filename, 'w').write(html)
  open(filename[:-4]+'css', 'w').write(style)
  print "{'error':'', 'status':1}"

def remove():
  os.remove(os.path.join(base, form['name'].value))
  os.remove(os.path.join(base, form['name'].value[:-4]+'css'))
  print "{'error':'', 'status':1}"

requireds = {'list_frames':[],
             'get_username':[],
             'remove':['name'],
             'load':['name'],
             'save':['name', 'html', 'style']}
custom_type = []

if __name__=='__main__':
  init()
  if not loggedin:
    print 'Content-type:text/html\n'
    die('not loggen in')
  try:
    if not form.has_key('cmd') or not form['cmd'].value in requireds:
      die('Invalid Command')
    for req in requireds[form['cmd'].value]:
      if not form.has_key(req):
        die('missing argment %s'%req)
    if not form['cmd'].value in custom_type:
      print 'Content-type:text/html\n'
    globals()[form['cmd'].value]()
  except:
    print 'Content-type:text/plain'
    print 'Cache-control:max-age=3600\n'
    raise

