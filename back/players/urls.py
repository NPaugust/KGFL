from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlayerViewSet, PlayerStatsViewSet, PlayerTransferViewSet

router = DefaultRouter()
router.register(r'stats', PlayerStatsViewSet)
router.register(r'transfers', PlayerTransferViewSet)
router.register(r'', PlayerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]