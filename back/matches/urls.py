from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MatchViewSet, GoalViewSet, CardViewSet, SubstitutionViewSet, StadiumViewSet

router = DefaultRouter()
router.register(r'stadiums', StadiumViewSet)
router.register(r'', MatchViewSet)
router.register(r'goals', GoalViewSet)
router.register(r'cards', CardViewSet)
router.register(r'substitutions', SubstitutionViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 