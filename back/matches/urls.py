from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MatchViewSet, GoalViewSet, CardViewSet, SubstitutionViewSet

router = DefaultRouter()
router.register(r'', MatchViewSet)
router.register(r'goals', GoalViewSet)
router.register(r'cards', CardViewSet)
router.register(r'substitutions', SubstitutionViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 