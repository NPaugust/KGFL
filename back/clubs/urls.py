from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClubViewSet, CoachViewSet, ClubSeasonViewSet, ClubApplicationViewSet

router = DefaultRouter()
router.register(r'', ClubViewSet)
router.register(r'coaches', CoachViewSet)
router.register(r'seasons', ClubSeasonViewSet)
router.register(r'applications', ClubApplicationViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 