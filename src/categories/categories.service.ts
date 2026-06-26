import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type Locale = 'ar' | 'en';

type LocalizedField = Record<Locale, string>;

type CategoryResponse = {
  _id: unknown;
  name: LocalizedField;
  description: LocalizedField;
  createdAt?: Date;
  updatedAt?: Date;
};

type LocalizedCategoryResponse = Omit<
  CategoryResponse,
  'name' | 'description'
> & {
  name: string;
  description: string;
};

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, language?: string) {
    const category = await this.categoryModel.create(createCategoryDto);

    return this.findOne(String(category._id), language);
  }

  async findAll(language?: string) {
    const categories = await this.categoryModel
      .find()
      .sort({ createdAt: -1 })
      .lean<CategoryResponse[]>()
      .exec();
    const locale = this.resolveLocale(language);

    return locale
      ? categories.map((category) => this.localizeCategory(category, locale))
      : categories;
  }

  async findOne(id: string, language?: string) {
    const category = await this.categoryModel
      .findById(id)
      .lean<CategoryResponse>()
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const locale = this.resolveLocale(language);

    return locale ? this.localizeCategory(category, locale) : category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    language?: string,
  ) {
    const category = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, {
        new: true,
        runValidators: true,
      })
      .lean<CategoryResponse>()
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const locale = this.resolveLocale(language);

    return locale ? this.localizeCategory(category, locale) : category;
  }

  async remove(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return { message: 'Category deleted successfully' };
  }

  private resolveLocale(language?: string): Locale | null {
    return language === 'ar' || language === 'en' ? language : null;
  }

  private localizeCategory(
    category: CategoryResponse,
    locale: Locale,
  ): LocalizedCategoryResponse {
    return {
      ...category,
      name: this.translateLocalizedField(category.name, locale),
      description: this.translateLocalizedField(category.description, locale),
    };
  }

  private translateLocalizedField(
    field: Partial<Record<Locale, string>> | undefined,
    locale: Locale,
  ): string {
    return (
      field?.[locale]?.trim() || field?.en?.trim() || field?.ar?.trim() || ''
    );
  }
}
