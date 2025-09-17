from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MatchViewSet, GoalViewSet, CardViewSet, SubstitutionViewSet, StadiumViewSet, AssistViewSet

router = DefaultRouter()
router.register(r'stadiums', StadiumViewSet)
router.register(r'goals', GoalViewSet)
router.register(r'cards', CardViewSet)
router.register(r'assists', AssistViewSet)
router.register(r'substitutions', SubstitutionViewSet)
# MatchViewSet должен быть последним чтобы не перехватывать другие URLs
router.register(r'', MatchViewSet)

urlpatterns = [
    # Отдельные endpoints для latest и upcoming
    path('latest/', MatchViewSet.as_view({'get': 'latest'}), name='match-latest'),
    path('upcoming/', MatchViewSet.as_view({'get': 'upcoming'}), name='match-upcoming'),
    path('', include(router.urls)),
] 