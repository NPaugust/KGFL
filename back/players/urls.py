from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlayerViewSet, PlayerStatsViewSet

router = DefaultRouter()
router.register(r'stats', PlayerStatsViewSet)
router.register(r'', PlayerViewSet)

urlpatterns = [
    path('top-scorers/', PlayerViewSet.as_view({'get': 'top_scorers'}), name='player-top-scorers'),
    path('', include(router.urls)),
] 