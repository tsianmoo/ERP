package com.productmanagement.repository;

import com.productmanagement.entity.ColorValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ColorValueRepository extends JpaRepository<ColorValue, Integer> {
    
    List<ColorValue> findByGroupIdOrderBySortOrderAsc(Integer groupId);
}
