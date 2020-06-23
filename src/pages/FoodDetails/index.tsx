import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  thumbnail_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const response = await api.get<Food>(`/foods/${routeParams.id}`);

      const formattedPriceFood = {
        ...response.data,
        formattedPrice: formatValue(response.data.price),
      };

      const extrasFood = response.data.extras;

      const formattedExtraFood = extrasFood.map(extra => {
        return {
          ...extra,
          quantity: 0,
        };
      });

      setFood(formattedPriceFood);
      setExtras(formattedExtraFood);
    }

    loadFood();
  }, [routeParams]);

  useEffect(() => {
    async function loadFavorites(): Promise<void> {
      const response = await api.get<Food[]>('favorites');

      const favorite = response.data.find(
        findFavorite => findFavorite.id === routeParams.id,
      );
      setIsFavorite(!!favorite);
    }

    loadFavorites();
  }, [routeParams.id]);

  function handleIncrementExtra(id: number): void {
    const incrementExtraFood = extras.map(extra => {
      if (extra.id === id) {
        return {
          ...extra,
          quantity: extra.quantity + 1,
        };
      }

      return { ...extra };
    });

    setExtras(incrementExtraFood);
  }

  function handleDecrementExtra(id: number): void {
    const decrementExtraFood = extras.map(extra => {
      if (extra.id === id && extra.quantity > 0) {
        return {
          ...extra,
          quantity: extra.quantity - 1,
        };
      }

      return { ...extra };
    });

    setExtras(decrementExtraFood);
  }

  function handleIncrementFood(): void {
    setFoodQuantity(oldState => oldState + 1);
  }

  function handleDecrementFood(): void {
    if (foodQuantity === 1) {
      setFoodQuantity(1);
    } else {
      setFoodQuantity(oldState => oldState - 1);
    }
  }

  const toggleFavorite = useCallback(async () => {
    if (isFavorite) {
      await api.delete(`/favorites/${food.id}`);
      setIsFavorite(false);
      return;
    }

    const {
      id,
      name,
      description,
      price,
      category,
      image_url,
      thumbnail_url,
    } = food;

    await api.post('/favorites', {
      id,
      name,
      description,
      price,
      category,
      image_url,
      thumbnail_url,
    });

    setIsFavorite(true);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const extrasTotal = extras.reduce((extrasAccumulator, extra) => {
      return extrasAccumulator + extra.quantity * extra.value;
    }, 0);

    const foodTotal = food.price * foodQuantity;

    const totalPrice = foodTotal + extrasTotal;

    const formattedTotalPrice = formatValue(totalPrice);

    return [totalPrice, formattedTotalPrice];
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const { name, description, category, thumbnail_url } = food;

    const order = {
      product_id: 1,
      name,
      description,
      price: cartTotal[0],
      category,
      thumbnail_url,
      extras: [...extras],
    };

    await api.post('/orders', order);

    navigation.reset({
      routes: [{ name: 'Dashboard' }],
      index: 0,
    });
  }

  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal[1]}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
