from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SeasonStatsViewSet, ClubStatsViewSet

router = DefaultRouter()
router.register(r'seasons', SeasonStatsViewSet)
router.register(r'clubs', ClubStatsViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 