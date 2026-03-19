package com.productmanagement.repository;

import com.productmanagement.entity.ImageCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageCategoryRepository extends JpaRepository<ImageCategory, Integer> {
    
    List<ImageCategory> findAllByOrderBySortOrderAsc();
    
    List<ImageCategory> findByTypeOrderBySortOrderAsc(String type);
}
