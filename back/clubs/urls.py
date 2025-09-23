from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClubViewSet, CoachViewSet, ClubSeasonViewSet, ClubApplicationViewSet

router = DefaultRouter()
router.register(r'', ClubViewSet)
router.register(r'seasons', ClubSeasonViewSet)
router.register(r'applications', ClubApplicationViewSet)

urlpatterns = [
    path('table/', ClubViewSet.as_view({'get': 'table'}), name='club-table'),
    path('coaches/', CoachViewSet.as_view({'get': 'by_club'}), name='club-coaches'),
    path('', include(router.urls)),
] 