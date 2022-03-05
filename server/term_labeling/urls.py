from django.urls import path, re_path
from django.contrib.auth import views as auth_views
from . import views

"""
connection between views.py functions and ajax call in frontend.
"""

# if you change the name here make sure to change it in the navbar in base.html

urlpatterns = [
    # pages
    path('', views.index, name='index'),
    path('main_tag_page/', views.main_tag_page, name='main_tag_page'),
    path('tags/', views.tags, name='tags'),
    path('select_poet_page/', views.select_poet_page, name='select_poet_page'),
    path('settings/', views.settings, name='settings'),
    path('statistics/', views.statistics, name='statistics'),
    path('poet_poems/', views.poet_poems, name="poet_poems"),
    path('logout/', auth_views.LogoutView.as_view(template_name='logout.html'), name="logout"),
    re_path('edit_poem_line/$', views.edit_poem_line, name='edit_poem_line'),
    re_path('save_term_tag/$', views.save_term_tag, name='save_term_tag'),
    re_path('suggest_tags/$', views.suggest_tags, name='suggest_tags'),
    re_path('get_children/$', views.get_children, name='get_children'),
    re_path('get_parent/$', views.get_parent, name='get_parent'),
    re_path('get_roots/$', views.get_roots, name='get_roots'),
    re_path('add_root/$', views.add_root, name='add_root'),
    re_path('add_tag/$', views.add_tag, name='add_tag'),
    re_path('get_brothers/$', views.get_brothers, name='get_brothers'),
    re_path('get_depth/$', views.get_depth, name='get_depth'),
    re_path('remove_tag/$', views.remove_tag, name='remove_tag'),
    re_path('add_parent/$', views.add_parent, name='add_parent'),
    re_path('edit_tag/$', views.edit_tag, name='edit_tag'),
    re_path('change_parent/$', views.change_parent, name='change_parent'),
    re_path('delete_all/$', views.delete_all, name='delete_all'),
    re_path('get_all_tags/$', views.get_all_tags, name='get_all_tags'),
    re_path('get_all_poets/$', views.get_all_poets, name='get_all_poets'),
    re_path('get_terms_freq/$', views.get_terms_freq, name='get_terms_freq'),
    re_path('maxFrequencyinPeriod/$', views.maxFrequencyinPeriod, name='maxFrequencyinPeriod'),
    re_path('get_words_analyzation/$', views.get_words_analyzation, name='get_words_analyzation'),
    re_path('term_current_tags/$', views.term_current_tags, name='term_current_tags'),
    re_path('remove_tag_from_word/$', views.remove_tag_from_word, name='remove_tag_from_word'),
    re_path('get_Root_of_Word/$', views.get_Root_of_Word, name='get_Root_of_Word'),
    re_path('get_Tags_frequency_in_poem/$', views.get_Tags_frequency_in_poem, name='get_Tags_frequency_in_poem'),
    re_path('add_all_suggestions/$', views.add_all_suggestions, name='add_all_suggestions'),
    re_path('get_all_tags_for_poet/$', views.get_all_tags_for_poet, name='get_all_tags_for_poet'),
    re_path('get_history_user/$', views.get_history_user, name='get_history_user'),
]
