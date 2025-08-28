from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlayerViewSet, PlayerStatsViewSet

router = DefaultRouter()
router.register(r'', PlayerViewSet)
router.register(r'stats', PlayerStatsViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('top-scorers/', PlayerViewSet.as_view({'get': 'top_scorers'}), name='player-top-scorers'),
] 