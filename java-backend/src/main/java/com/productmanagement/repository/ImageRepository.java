package com.productmanagement.repository;

import com.productmanagement.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageRepository extends JpaRepository<Image, Integer> {
    
    List<Image> findByCategoryIdOrderByCreatedAtDesc(Integer categoryId);
    
    List<Image> findAllByOrderByCreatedAtDesc();
}
