#!/usr/bin/env python

from google.appengine.ext.webapp import template
from google.appengine.ext import ndb

import logging
import os.path
import webapp2
import jinja2
import authenticate
import models
import os
import json
import urllib
import operator

from webapp2_extras import auth
from webapp2_extras import sessions

from google.appengine.ext import ndb
from google.appengine.ext.db import Key
from webapp2_extras.auth import InvalidAuthIdError
from webapp2_extras.auth import InvalidPasswordError


import webapp2


JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

class Shout(ndb.Model):
    user = ndb.KeyProperty(kind=models.User, indexed=True)
    content = ndb.StringProperty()
    isAnon = ndb.BooleanProperty()
    isPrivate = ndb.BooleanProperty()
    location = ndb.GeoPtProperty()
    commentCount = ndb.IntegerProperty(default=0)
    date = ndb.DateTimeProperty(auto_now_add=True, indexed=True)

    @classmethod
    def query_area(shout,sw,ne):
        return shout.query(Shout.location >= sw, Shout.location <= ne)


class Comment(ndb.Model):
    user_name = ndb.StringProperty()
    user_id = ndb.StringProperty(indexed=True)
    content = ndb.StringProperty()
    isAnon = ndb.BooleanProperty()
    date = ndb.DateTimeProperty(auto_now_add=True)

    @classmethod
    def query_comment(cls, ancestor_key):
        return cls.query(ancestor=ancestor_key).order(+cls.date)


class MainWall(authenticate.BaseHandler):
    @authenticate.user_required
    def get(self):
        # logging.info('---WALL HANDLER' + str(self.user)+'keyyyyy----'+str(self.user.key))
        # sw = ndb.GeoPt(float(self.request.get('sw_lat')), float(self.request.get('sw_lng')))
        # ne = ndb.GeoPt(float(self.request.get('ne_lat')), float(self.request.get('ne_lng')))
        # logging.info('---WALL HANDLER' + self.request.get('sw_lat'))
        shouts = Shout.query()

        keys = [s.user for s in shouts]
        users = ndb.get_multi(keys)
        user_shouts = zip(users, shouts)


        template_values = {
            'user': self.user
        }


        template = JINJA_ENVIRONMENT.get_template('views/wall.html')
        self.response.write(template.render(template_values))

        #self.render_template('wall.html', template_values)

class MainWallFilter(authenticate.BaseHandler):
    @authenticate.user_required
    def get(self,*args, **kwargs):
        sw = ndb.GeoPt(float(self.request.get('sw_lat')), float(self.request.get('sw_lng')))
        ne = ndb.GeoPt(float(self.request.get('ne_lat')), float(self.request.get('ne_lng')))

        # shouts = Shout.query(Shout.location >= sw, Shout.location <= ne, Shout.date).order(+Shout.date)
        shouts = Shout.query_area(sw,ne).order(Shout.location).order(Shout.date).fetch()
        # order = shouts.orders
        # shouts = sorted(shouts_q, key=lambda k: k['date'])
        # shouts = Shout.gql("WHERE location >= :1 AND location <= :2",sw,ne)


        # USING JINJA SERVER SIDE TEMPLATING METHOD
        keys = [s.user for s in shouts]
        users = ndb.get_multi(keys)
        user_shouts = zip(users, shouts)
        user_shouts.sort()

        # RENDER SHOUT HTML
        template_values = {
            'user_shouts': user_shouts,
            'shouts': shouts
        }
        template = JINJA_ENVIRONMENT.get_template('views/shout.html')
        shouts_html = template.render(template_values)


        # ADD SHOUT LOCATIONS
        shout_dic = {}
        shout_dic['shout_html'] = shouts_html
        shout_dic['shouts'] = {}
        for s in shouts:
            shout_dic['shouts'][str(s.key.id())] = {}
            shout_dic['shouts'][str(s.key.id())]['lat'] = s.location.lat
            shout_dic['shouts'][str(s.key.id())]['lng'] = s.location.lon

        json_comments = json.dumps(shout_dic)
        self.response.out.headers['Content-Type'] = 'text/json'
        self.response.write(json_comments)


        # # USING DIC AND CLIENT SIDE RENDERING WITH JS
        # shout_dic = {}
        # i = 0;
        # for s in shouts:
        #     shout_dic['shout'+str(i)] = {}
        #     shout_dic['shout'+str(i)]['content'] = s.content
        #     shout_dic['shout'+str(i)]['ID'] = s.key.id()
        #     shout_dic['shout'+str(i)]['date'] = s.date
        #     shout_dic['shout'+str(i)]['isAnon'] = s.isAnon
        #     shout_dic['shout'+str(i)]['isPrivate'] = s.isPrivate
        #     shout_dic['shout'+str(i)]['lat'] = s.location.lat
        #     shout_dic['shout'+str(i)]['lng'] = s.location.lon
        #     if s.isAnon:
        #         shout_dic['shout'+str(i)]['user_name'] = 'Anonymous'
        #     else:
        #         shout_dic['shout'+str(i)]['user_name'] = s.user.get().name
        #         shout_dic['shout'+str(i)]['user_ID'] = s.user.id()
        #     i += 1
        #
        #
        # template_values = {
        #     'user_shouts': shout_dic
        # }

        # json_comments = json.dumps(shout_dic, default=date_handler)
        # self.response.out.write(json_comments)

class postShout(authenticate.BaseHandler):
    def post(self):
        #check if anon
        isAnon = self.request.get('isAnon')
        if isAnon == 'true':
            isAnon = True
        else:
            isAnon = False

        isPrivate = self.request.get('isPrivate')
        if isPrivate == 'on':
            isPrivate = True
        else:
            isPrivate = False

        loc = ndb.GeoPt(float(self.request.get('lat')), float(self.request.get('lng')))
        shout = Shout()
        shout.user = self.user.key
        shout.content = self.request.get('shoutContent')
        shout.isAnon = isAnon
        shout.isPrivate = isPrivate
        shout.location = loc
        shout.put()
        # self.redirect('/wall')

class postComment(authenticate.BaseHandler):
    def post(self,post_id):
        shout_id = self.request.get('post_id')
        new_comment = Comment(parent=ndb.Key(Shout, shout_id))
        # new_comment.shout_key = ndb.Key(Shout, post_id)
        # if anon don't save name, just put anon
        new_comment.user_name = str(self.user.name +" "+self.user.last_name)
        new_comment.user_id = str(self.user.key.id())
        new_comment.content = self.request.get('comment_content')
        new_comment.isAnon = True
        new_comment.put()
        # update number of comment count
        shout = ndb.Key('Shout', int(self.request.get('post_id'))).get()
        shout.commentCount += 1
        shout.put()


class showComment(authenticate.BaseHandler):
    def get(self,*args, **kwargs):
        id=str(self.request.get('shout_id'))
        shout_key = ndb.Key(Shout, id)
        comments = Comment.query_comment(shout_key).fetch()

        # RENDER SHOUT HTML
        template_values = {
            'comments': comments
        }
        template = JINJA_ENVIRONMENT.get_template('views/comment.html')
        comments_html = template.render(template_values)
        self.response.out.write(comments_html)

        # converting into dict then json to send back
        # json_comments = json.dumps([dict(p.to_dict(), **dict(id=p.key.id())) for p in comments], default=date_handler)
        # self.response.out.headers['Content-Type'] = 'text/json'
        # self.response.out.write(json_comments)

class getUser (authenticate.BaseHandler):
    @authenticate.user_required
    def get(self,username):
        user_search = self.request.get('username')
        name_query = ndb.AND(models.User.name >= user_search, models.User.name <= user_search+u'\ufffd')
        username_query = ndb.AND(models.User.auth_ids >= user_search, models.User.auth_ids <= user_search+u'\ufffd')
        users = models.User.query(ndb.OR(name_query,username_query)).fetch(5)
        user_dic = {}
        i = 0;
        for u in users:
            logging.info('---WALL HANDLER  ' + str(users[i].name))
            user_dic['user'+str(i)] = {}
            user_dic['user'+str(i)]['first_name'] = u.name
            user_dic['user'+str(i)]['last_name'] = u.last_name
            i += 1

            #user_dic['user'+str(i)]['ID'] = u.key.id

        json_users = json.dumps(user_dic)
        self.response.out.headers['Content-Type'] = 'text/json'
        self.response.write(json_users)


def date_handler(obj):
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    else:
        raise TypeError("Unserializable object {} of type {}".format(obj,type(obj)))


config = {
    'webapp2_extras.auth': {
        'user_model': 'models.User',
        'user_attributes': ['name']
    },
    'webapp2_extras.sessions': {
        'secret_key': 'YOUR_SECRET_KEY'
    }
}

app = webapp2.WSGIApplication([
                                  ('/wall', MainWall),
                                  ('/wall/(.*)', MainWallFilter),
                                  ('/shout', postShout),
                                  ('/shout/comments/(.*)', showComment),
                                  ('/comment/(.*)', postComment),
                                  ('/user/(.*)', getUser),
                              ], debug=True,config=config)



logging.getLogger().setLevel(logging.DEBUG)
