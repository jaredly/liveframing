import sys
import __main__

def exit(data={}):
  if not data.has_key('error'):
    data['error']=''
  if not data.has_key('status'):
    data['status'] = 1
  if not __main__.send_header:
    print 'Content-type:text/html\n'
  print data
  sys.exit(0)

def die(cause = 'Invalid Arguments', **kwargs):
  if not __main__.send_header:
    print 'Content-type:text/html\n'
  kwargs.update({'error':cause,'status':0})
  exit(kwargs)

